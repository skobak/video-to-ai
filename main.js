import { WebSocket } from 'ws'
import fs from 'fs'
import { mockPayload } from './mockPayload.js'
import { generatePrompts } from './promptsGenerator.js'
import { Image } from 'canvas'
import { videoToFrames, countFilesInFolder } from './videoToFrames.js'

let count = 0
let prompts = []
let payloads = []
let framesCount = 0
const ws_url = 'ws://127.0.0.1:7860/queue/join'

const generateImageWithAPrompt = async (index) => {
  const ws = new WebSocket(ws_url)

  // Connection opened
  ws.addEventListener('open', function (event) {
    console.log('connected')
  })

  // Listen for messages
  ws.addEventListener('message', async function (event) {
    let result = JSON.parse(event.data)
    console.log(result)
    const msg = result['msg']
    switch (msg) {
      case 'send_hash':
        const reply = {
          fn_index: 162,
          session_hash: '8yzyqk2gv88',
        }
        sendMsg(JSON.stringify(reply))
        break
      case 'send_data':
        console.log(
          `Prompt ${count}: ${payloads[index].data[2]},
		CFG Scale: ${payloads[index].data[21]},
		Denoising strength: ${payloads[index].data[23]}
		`
        )
        sendMsg(JSON.stringify(payloads[index]))
        break
      case 'process_completed':
        console.log('Done')
        count++
        ws.removeAllListeners()
        ws.close()

        // In case we want to use previous image as a prompt for the next one
        // const fileName = result['output']['data'][0][0]['name']
        // const base64 = await imageToBase64(fileName)
        // payloads[index+1].data[5] = base64
        if (count < framesCount) {
          generateImageWithAPrompt(count)
        }
        break
    }
  })

  const sendMsg = (msg) => {
    ws.send(msg)
  }
}

function imageToBase64(file) {
  return 'data:image/png;base64,' + fs.readFileSync(file, 'base64')
}

function getWidthAndHeightOfBase64(base64) {
  const img = new Image()
  img.src = base64
  return [img.width, img.height]
}

const main = async () => {
  const firstFrameIndex = 1
  const framesFolderPath = './frames'
  const frameNamePrefix = 'frame-'
  const frameNameSuffix = '.png'

  console.log('SnabbtAI script started')

  console.log('Converting video to frames..')
  await videoToFrames('./video/video.mp4')
  console.log('Done')

  framesCount = await countFilesInFolder(framesFolderPath)
  prompts = generatePrompts(framesCount)
  console.log(framesCount)
  console.log('----------')
  for (let i = 0; i < framesCount; i++) {
    const _payload = deepClone(mockPayload)
    //     _payload.data[2] = prompts[i]
    _payload.data[2] = `Make a orange tiger cat amd make it look like a pastel painting`
    const framePath = `${framesFolderPath}/${frameNamePrefix}${
      i + firstFrameIndex
    }${frameNameSuffix}`
    _payload.data[5] = imageToBase64(framePath)
    console.log(framePath)
    const [width, height] = getWidthAndHeightOfBase64(_payload.data[5])
    _payload.data[31] = height
    _payload.data[32] = width
    _payload.data[21] = 14.0 // creativity scale 1-30
    _payload.data[23] = 0.2 // denoising strength 0-1
    _payload.data[24] = -1 // seed
    // insert in to the start of array
    payloads.push(_payload)
  }

  await generateImageWithAPrompt(0)
}

function deepClone(obj) {
  return JSON.parse(JSON.stringify(obj))
}

// run main in async mode
main()
