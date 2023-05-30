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

// Frame naming convention
const FRAME_NAME = {
  firstIndex: 1,
  folderPath: './frames',
  prefix: 'frame-',
  suffix: '.png',
}

// Application Configuration settings
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

// Function to set configuration settings from command-line arguments
const setConfigurationFromArgs = () => {
  const args = minimist(process.argv.slice(2))

  // Parse command line arguments
  if (args.c) CONFIG.scale = parseFloat(args.c)
  if (args.d) CONFIG.denoise = parseFloat(args.d)
  if (args.s) CONFIG.seed = parseInt(args.s)
  if (args.p) CONFIG.prompt = args.p
  if (args.i) CONFIG.promptPath = args.i.toString()
  if (args.f) CONFIG.selectedFrame = parseInt(args.f)
  if (args.v) CONFIG.videoPath = args.v.toString()

  // Set option to 0 if prompt argument is provided, else 1
  CONFIG.option = args.p ? 0 : 1
}

// Function to generate payload for AI processing
const generatePayload = (payload, prompt, framePath) => {
  const clonedPayload = JSON.parse(JSON.stringify(payload)) // create a deep copy of payload
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

// Function to apply AI mask on video frames
const addAIMaskOnVideo = async () => {
  for (let i = 0; i < framesCount; i++) {
    const framePath = `${FRAME_NAME.folderPath}/${FRAME_NAME.prefix}${
      i + FRAME_NAME.firstIndex
    }${FRAME_NAME.suffix}`
    const payload = generatePayload(mockPayload, CONFIG.prompt, framePath)
    await generateAIImage(payload)
  }
}

// Function to add prompts on a particular video frame
const addPromptsOnVideoFrame = async (prompts) => {
  let framePath = `${FRAME_NAME.folderPath}/${FRAME_NAME.prefix}${CONFIG.selectedFrame}${FRAME_NAME.suffix}`
  for (const prompt of prompts) {
    const payload = generatePayload(mockPayload, prompt, framePath)
    framePath = await generateAIImage(payload)
  }
}

// Main function to execute the process
const main = async () => {
  // Set configuration from command-line arguments
  setConfigurationFromArgs()

  // Initialize frames folder
  await initializeFramesFolder()

  // Convert video to frames
  await videoToFrames(CONFIG.videoPath)

  // Count number of frames
  const framesCount = await countFilesInFolder(FRAME_NAME.folderPath)

  // If prompt is given, apply AI mask on video
  if (CONFIG.option === 0) {
    await addAIMaskOnVideo(framesCount)
  } else {
    // Else, add prompts to a selected video frame
    const prompts = await parseCSV(CONFIG.promptPath)
    if (CONFIG.selectedFrame < 0) CONFIG.selectedFrame = framesCount
    await addPromptsOnVideoFrame(prompts)
  }
}

// Execute main function and catch any error
main().catch(console.error)
