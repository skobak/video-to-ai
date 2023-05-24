import ffmpegPath from 'ffmpeg-static'
import ffmpeg from 'fluent-ffmpeg'
import fs from 'fs'
import path from 'path'

const videoToFrames = async (videoPath) => {
  // Set the path to your input video file
  const inputVideoPath = videoPath

  // Set the path to the output folder where frames will be saved
  const outputFolderPath = './frames'
  await cleanFolder(outputFolderPath)
  return new Promise((resolve, reject) => {
    // Configure ffmpeg with the correct path
    ffmpeg.setFfmpegPath(ffmpegPath)

    // Create the output folder if it doesn't exist
    if (!fs.existsSync(outputFolderPath)) {
      fs.mkdirSync(outputFolderPath)
    }

    // Extract frames from the video
    ffmpeg(inputVideoPath)
      .output(`${outputFolderPath}/frame-%d.png`)
      .on('end', () => {
        resolve()
      })
      .on('error', (err) => {
        reject(err)
      })
      .run()
  })
}

async function countFilesInFolder(folderPath) {
  const files = await fs.promises.readdir(folderPath)
  return files.length
}

async function cleanFolder(folderPath) {
  const files = await fs.promises.readdir(folderPath)

  for (const file of files) {
    const filePath = path.join(folderPath, file)
    const fileStat = await fs.promises.stat(filePath)

    if (fileStat.isDirectory()) {
      await cleanFolder(filePath)
    } else {
      await fs.promises.unlink(filePath)
      console.log(`Deleted file: ${filePath}`)
    }
  }

  await fs.promises.rmdir(folderPath)
  console.log(`Deleted folder: ${folderPath}`)
}

export { videoToFrames, countFilesInFolder }
