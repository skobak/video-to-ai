import { mockPayload } from './mockPayload.js'
import { videoToFrames, countFilesInFolder } from './videoToFrames.js'
import { generateAIImage } from './stableDiffusion.js'
import { imageToBase64, getWidthAndHeightOfBase64, parseCSV } from './utils.js'
import minimist from 'minimist'

/** Usage */
// Option 1: Add mask on full video with a prompt
// node main.js
// -v <video path>
// -p <prompt>
// -c <creativity scale 1-30>
// -d <denoising strength 0-1>
// -s <seed>

// Example:
// node main.js -p="hej there" -v='./video.mp4'

// Option 2: Add prompts on a specific video frame
// node main.js
// -v <video path>
// -f <frame number> (optional, default is last frame)
// -i <prompt input file path>
// node main.js -i='./prompts.txt' -v='./video.mp4' -f=50

const firstFrameIndex = 1
const framesFolderPath = './frames'
const frameNamePrefix = 'frame-'
const frameNameSuffix = '.png'
let CFG_Scale = 14 // creativity scale 1-30
let denoising_Strength = 0.2 // denoising strength 0-1
let seed = -1 // seed
let videoPath = './video.mp4'
let promptPath = './prompts.txt'
let option = 0
let prompt = ''
let selectedFrame = -1

const generatePayload = (payload, prompt, framePath) => {
  try {
    const _payload = structuredClone(payload)

    // Modify prompt
    _payload.data[2] = prompt

    _payload.data[5] = imageToBase64(framePath)

    // Set width and height
    const [width, height] = getWidthAndHeightOfBase64(_payload.data[5])
    _payload.data[31] = height
    _payload.data[32] = width

    // Set creativity scale
    _payload.data[21] = CFG_Scale
    _payload.data[23] = denoising_Strength
    _payload.data[24] = seed
    return _payload
  } catch (error) {
    console.log(error)
  }
}

const addAIMaskOnVideo = async (prompt, framesCount) => {
  try {
    for (let i = 0; i < framesCount; i++) {
      const framePath = `${framesFolderPath}/${frameNamePrefix}${
        i + firstFrameIndex
      }${frameNameSuffix}`
      const _payload = generatePayload(mockPayload, prompt, framePath)
      await generateAIImage(_payload)
    }
  } catch (error) {
    console.error(error)
  }
}

const addPromptsOnVideoFrame = async (frameNumber, prompts) => {
  try {
    let framePath = `${framesFolderPath}/${frameNamePrefix}${frameNumber}${frameNameSuffix}`
    console.log(framePath)
    for (let i = 0; i < prompts.length; i++) {
      const _payload = generatePayload(mockPayload, prompts[i], framePath)
      framePath = await generateAIImage(_payload)
    }
  } catch (error) {
    console.log(error)
  }
}

const parseArgs = async () => {
  const args = minimist(process.argv.slice(2))
  if (args['c'] != undefined) {
    CFG_Scale = parseFloat(args['c'])
  }
  if (args['d'] != undefined) {
    denoising_Strength = parseFloat(args['d'])
  }
  if (args['s'] != undefined) {
    seed = parseInt(args['s'])
  }
  if (args['p']) {
    prompt = args['p']
    option = 0
  }
  if (args['i']) {
    option = 1
    promptPath = args['i'].toString()
  }
  if (args['f'] != undefined) {
    selectedFrame = parseInt(args['f'])
  }
  if (args['v']) {
    videoPath = args['v'].toString()
  }
}

const main = async () => {
  try {
    parseArgs()
    await videoToFrames(videoPath)
    const framesCount = await countFilesInFolder(framesFolderPath)

    if (option == 0) {
      await addAIMaskOnVideo(prompt, framesCount)
    }

    if (option == 1) {
      const prompts = await parseCSV(promptPath)
      if (selectedFrame < 0) {
        selectedFrame = framesCount
      }
      await addPromptsOnVideoFrame(selectedFrame, prompts)
    }
  } catch (error) {
    console.error(error)
  }
}

main()
