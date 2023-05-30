import { WebSocket } from 'ws'

// WebSocket server URL
const ws_url = 'ws://127.0.0.1:7860/queue/join'

// Static initiation command for the WebSocket server
const staticInitiationCommand = {
  fn_index: 162,
  session_hash: '8yzyqk2gv88',
}

// Log the prompt and its associated properties
const logPrompt = (payload) => {
  console.log(
    `Prompt: ${payload.data[2]},
    CFG Scale: ${payload.data[21]},
    Denoising strength: ${payload.data[23]}
    `
  )
}

// Send the payload to the WebSocket server and return the created image file name
const generateAIImage = (payload) => {
  return new Promise((resolve, reject) => {
    const ws = new WebSocket(ws_url)

    ws.on('message', (event) => {
      try {
        const result = JSON.parse(event)
        const msg = result['msg']

        console.log(result)

        switch (msg) {
          case 'send_hash':
            // The server asks for the initiation command, send it
            ws.send(JSON.stringify(staticInitiationCommand))
            break
          case 'send_data':
            // The server asks for the payload, log the payload and send it
            logPrompt(payload)
            ws.send(JSON.stringify(payload))
            break
          case 'process_completed':
            // The server notifies that the process is completed, log the message and resolve the promise with the created file name
            console.log('Done')
            const createdFileName = result['output']['data'][0][0]['name']
            ws.removeAllListeners()
            ws.close()
            resolve(createdFileName)
            break
        }
      } catch (e) {
        // If an error occurs, log it and reject the promise
        console.log(e)
        reject(e)
      }
    })
  })
}

export { generateAIImage }
