import fs from 'fs'
import { Image } from 'canvas'
import csv from 'csv-parser'

// Convert an image to base64
const imageToBase64 = (filePath) => {
  // Read the file data as base64
  const fileData = fs.readFileSync(filePath, 'base64')

  // Return the base64 data as an image source string
  return `data:image/png;base64,${fileData}`
}

// Get the width and height of an image given its base64 representation
const getWidthAndHeightOfBase64 = (base64) => {
  // Create a new image
  const img = new Image()

  // Set the source of the image to be the base64 data
  img.src = base64

  // Return the width and height of the image
  return [img.width, img.height]
}

// Parse a CSV file
const parseCSV = (filePath) => {
  // Create a new promise
  return new Promise((resolve, reject) => {
    // Initialize an empty array to hold the rows
    const rows = []

    // Create a read stream from the file
    fs.createReadStream(filePath)
      // Pipe the stream to the CSV parser
      .pipe(csv({ headers: false }))
      // When a row is received, push it to the rows array
      .on('data', (row) => rows.push(Object.values(row)[0]))
      // When the stream ends, resolve the promise with the rows
      .on('end', () => resolve(rows))
      // If an error occurs, reject the promise with the error
      .on('error', reject)
  })
}

export { imageToBase64, getWidthAndHeightOfBase64, parseCSV }
