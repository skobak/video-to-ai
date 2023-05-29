import ffmpeg from 'fluent-ffmpeg'
import ffmpegPath from 'ffmpeg-static'
import fs from 'fs'
import path from 'path'

ffmpeg.setFfmpegPath(ffmpegPath)

const OUTPUT_FOLDER_PATH = './frames'

const videoToFrames = (videoPath) => {
  return new Promise((resolve, reject) => {
    ffmpeg(videoPath)
      .output(`${OUTPUT_FOLDER_PATH}/frame-%d.png`)
      .on('end', resolve)
      .on('error', reject)
      .run()
  })
}

const countFilesInFolder = async (folderPath) => {
  const files = await fs.promises.readdir(folderPath)
  return files.length
}

const cleanFolder = async (folderPath) => {
  const files = await fs.promises.readdir(folderPath)

  for (const file of files) {
    const filePath = path.join(folderPath, file)
    const fileStat = await fs.promises.stat(filePath)

    if (fileStat.isDirectory()) {
      await cleanFolder(filePath)
    } else {
      await fs.promises.unlink(filePath)
    }
  }

  if (folderPath !== OUTPUT_FOLDER_PATH) await fs.promises.rmdir(folderPath)
}

const initializeFramesFolder = async () => {
  if (fs.existsSync(OUTPUT_FOLDER_PATH)) {
    await cleanFolder(OUTPUT_FOLDER_PATH)
    return
  }
  fs.mkdirSync(OUTPUT_FOLDER_PATH)
}

export { initializeFramesFolder, videoToFrames, countFilesInFolder }
