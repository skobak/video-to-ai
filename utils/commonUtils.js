import fs from 'fs'
import { Image } from 'canvas'
import csv from 'csv-parser'

const imageToBase64 = (filePath) => {
  const fileData = fs.readFileSync(filePath, 'base64')
  return `data:image/png;base64,${fileData}`
}

const getWidthAndHeightOfBase64 = (base64) => {
  const img = new Image()
  img.src = base64
  return [img.width, img.height]
}

const parseCSV = (filePath) => {
  return new Promise((resolve, reject) => {
    const rows = []
    fs.createReadStream(filePath)
      .pipe(csv({ headers: false }))
      .on('data', (row) => rows.push(Object.values(row)[0]))
      .on('end', () => resolve(rows))
      .on('error', reject)
  })
}

export { imageToBase64, getWidthAndHeightOfBase64, parseCSV }
