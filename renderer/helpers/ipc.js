import electron, { ipcRenderer } from 'electron'

const getResponseChannels = channel => ({
  sendChannel: `%nuxtron-send-channel-${channel}`,
  dataChannel: `%nuxtron-response-data-channel-${channel}`,
  errorChannel: `%nuxtron-response-error-channel-${channel}`
})

const getRendererResponseChannels = (windowId, channel) => ({
  sendChannel: `%nuxtron-send-channel-${windowId}-${channel}`,
  dataChannel: `%nuxtron-response-data-channel-${windowId}-${channel}`,
  errorChannel: `%nuxtron-response-error-channel-${windowId}-${channel}`
})

export default class ipc {
  static callMain(channel, data) {
    return new Promise((resolve, reject) => {
      const { sendChannel, dataChannel, errorChannel } = getResponseChannels(channel)

      const cleanup = () => {
        ipcRenderer.removeAllListeners(dataChannel)
        ipcRenderer.removeAllListeners(errorChannel)
      }

      ipcRenderer.on(dataChannel, (event, result) => {
        cleanup()
        resolve(result)
      })

      ipcRenderer.on(errorChannel, (event, error) => {
        cleanup()
        reject(error)
      })

      ipcRenderer.send(sendChannel, data)
    })
  }

  static answerMain(channel, callback) {
    const window = electron.remote.getCurrentWindow()
    const { sendChannel, dataChannel, errorChannel } = getRendererResponseChannels(window.id, channel)

    ipcRenderer.on(sendChannel, async (event, data) => {
      try {
        ipcRenderer.send(dataChannel, await callback(data))
      } catch (err) {
        ipcRenderer.send(errorChannel, err)
      }
    })
  }
}
