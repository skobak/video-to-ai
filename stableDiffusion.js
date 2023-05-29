import { WebSocket } from 'ws'
const ws_url = 'ws://127.0.0.1:7860/queue/join'
const staticInitiationCommand = {
  fn_index: 162,
  session_hash: '8yzyqk2gv88',
}

const generateAIImage = async (payload) => {
  return new Promise((resolve, reject) => {
    const ws = new WebSocket(ws_url)

    ws.addEventListener('message', async function (event) {
      try {
        let result = JSON.parse(event.data)
        const msg = result['msg']
        console.log(result)
        switch (msg) {
          case 'send_hash':
            sendMsg(JSON.stringify(staticInitiationCommand))
            break
          case 'send_data':
            logPrompt(payload)
            sendMsg(JSON.stringify(payload))
            break
          case 'process_completed':
            console.log('Done')
            const createdFileName = result['output']['data'][0][0]['name']
            ws.removeAllListeners()
            ws.close()
            resolve(createdFileName)
            break
        }
      } catch (e) {
        console.log(e)
        reject(e)
      }
    })

    const sendMsg = (msg) => {
      ws.send(msg)
    }

    const logPrompt = (payload) => {
      console.log(
        `Prompt: ${payload.data[2]},
		CFG Scale: ${payload.data[21]},
		Denoising strength: ${payload.data[23]}
		`
      )
    }
  })
}

export { generateAIImage }
