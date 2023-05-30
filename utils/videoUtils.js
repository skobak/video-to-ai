import ffmpeg from 'fluent-ffmpeg'
import ffmpegPath from 'ffmpeg-static'
import fs from 'fs'
import path from 'path'

// Set ffmpeg executable path
ffmpeg.setFfmpegPath(ffmpegPath)

const OUTPUT_FOLDER_PATH = './frames'

// Convert a video file into frames
const videoToFrames = (videoPath) => {
  return new Promise((resolve, reject) => {
    ffmpeg(videoPath)
      .output(`${OUTPUT_FOLDER_PATH}/frame-%d.png`) // Output frames as PNG files
      .on('end', resolve) // Resolve the promise when conversion is done
      .on('error', reject) // Reject the promise if an error occurs
      .run() // Start the conversion
  })
}

// Count files in a given folder
const countFilesInFolder = async (folderPath) => {
  const files = await fs.promises.readdir(folderPath)
  return files.length // Return the number of files
}

// Clean a folder by recursively deleting all files and subfolders
const cleanFolder = async (folderPath) => {
  const files = await fs.promises.readdir(folderPath)

  for (const file of files) {
    const filePath = path.join(folderPath, file)
    const fileStat = await fs.promises.stat(filePath)

    if (fileStat.isDirectory()) {
      // If the file is a directory, recursively clean it
      await cleanFolder(filePath)
    } else {
      // If the file is not a directory, delete it
      await fs.promises.unlink(filePath)
    }
  }

  // Remove the folder itself (if it is not the root output folder)
  if (folderPath !== OUTPUT_FOLDER_PATH) await fs.promises.rmdir(folderPath)
}

// Initialize the output folder
const initializeFramesFolder = async () => {
  if (fs.existsSync(OUTPUT_FOLDER_PATH)) {
    // If the folder exists, clean it
    await cleanFolder(OUTPUT_FOLDER_PATH)
    return
  }
  // If the folder does not exist, create it
  fs.mkdirSync(OUTPUT_FOLDER_PATH)
}

export { initializeFramesFolder, videoToFrames, countFilesInFolder }
