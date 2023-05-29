import minimist from 'minimist'
import {
  imageToBase64,
  getWidthAndHeightOfBase64,
  parseCSV,
} from './utils/commonUtils.js'
import { generateAIImage } from './utils/stableDiffusionUtils.js'
import {
  videoToFrames,
  countFilesInFolder,
  initializeFramesFolder,
} from './utils/videoUtils.js'
import { mockPayload } from './mockPayload.js'

const FRAME_NAME = {
  firstIndex: 1,
  folderPath: './frames',
  prefix: 'frame-',
  suffix: '.png',
}

const CONFIG = {
  scale: 14, // creativity scale 1-30
  denoise: 0.2, // denoising strength 0-1
  seed: -1, // seed
  videoPath: './video.mp4',
  promptPath: './prompts.txt',
  prompt: '',
  selectedFrame: -1,
  option: 0,
}

const setConfigurationFromArgs = () => {
  const args = minimist(process.argv.slice(2))

  if (args.c) CONFIG.scale = parseFloat(args.c)
  if (args.d) CONFIG.denoise = parseFloat(args.d)
  if (args.s) CONFIG.seed = parseInt(args.s)
  if (args.p) CONFIG.prompt = args.p
  if (args.i) CONFIG.promptPath = args.i.toString()
  if (args.f) CONFIG.selectedFrame = parseInt(args.f)
  if (args.v) CONFIG.videoPath = args.v.toString()

  CONFIG.option = args.p ? 0 : 1
}

const generatePayload = (payload, prompt, framePath) => {
  const clonedPayload = JSON.parse(JSON.stringify(payload)) // replace structuredClone
  clonedPayload.data[2] = prompt
  clonedPayload.data[5] = imageToBase64(framePath)

  const [width, height] = getWidthAndHeightOfBase64(clonedPayload.data[5])
  clonedPayload.data[31] = height
  clonedPayload.data[32] = width
  clonedPayload.data[21] = CONFIG.scale
  clonedPayload.data[23] = CONFIG.denoise
  clonedPayload.data[24] = CONFIG.seed

  return clonedPayload
}

const addAIMaskOnVideo = async () => {
  for (let i = 0; i < framesCount; i++) {
    const framePath = `${FRAME_NAME.folderPath}/${FRAME_NAME.prefix}${
      i + FRAME_NAME.firstIndex
    }${FRAME_NAME.suffix}`
    const payload = generatePayload(mockPayload, CONFIG.prompt, framePath)
    await generateAIImage(payload)
  }
}

const addPromptsOnVideoFrame = async (prompts) => {
  let framePath = `${FRAME_NAME.folderPath}/${FRAME_NAME.prefix}${CONFIG.selectedFrame}${FRAME_NAME.suffix}`
  for (const prompt of prompts) {
    const payload = generatePayload(mockPayload, prompt, framePath)
    framePath = await generateAIImage(payload)
  }
}

const main = async () => {
  setConfigurationFromArgs()
  await initializeFramesFolder()
  await videoToFrames(CONFIG.videoPath)

  const framesCount = await countFilesInFolder(FRAME_NAME.folderPath)

  if (CONFIG.option === 0) {
    await addAIMaskOnVideo(framesCount)
  } else {
    const prompts = await parseCSV(CONFIG.promptPath)
    if (CONFIG.selectedFrame < 0) CONFIG.selectedFrame = framesCount
    await addPromptsOnVideoFrame(prompts)
  }
}

main().catch(console.error)
