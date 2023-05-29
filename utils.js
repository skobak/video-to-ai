import fs from 'fs'
import { Image } from 'canvas'
import csv from 'csv-parser'

const imageToBase64 = (file) =>
  'data:image/png;base64,' + fs.readFileSync(file, 'base64')

const getWidthAndHeightOfBase64 = (base64) => {
  const img = new Image()
  img.src = base64
  return [img.width, img.height]
}

const parseCSV = async (file) => {
  return new Promise((resolve, reject) => {
    const rows = []
    fs.createReadStream(file)
      .pipe(csv({ headers: false }))
      .on('data', async (row) => {
        rows.push(Object.values(row)[0])
      })
      .on('end', () => {
        resolve(rows)
      })
      .on('error', reject)
  })
}

export { imageToBase64, getWidthAndHeightOfBase64, parseCSV }
