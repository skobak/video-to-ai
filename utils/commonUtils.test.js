import {
  imageToBase64,
  getWidthAndHeightOfBase64,
  parseCSV,
} from './commonUtils.js'
import csv from 'csv-parser'
import fs from 'fs'
import { Image } from 'canvas'

jest.mock('fs')
jest.mock('csv-parser')
jest.mock('canvas', () => ({ Image: jest.fn() }))

const mockFilePath = './test.png'
const mockFileData = 'mockFileData'
const mockImg = { width: 100, height: 200 }

describe('commonUtils', () => {
  describe('getWidthAndHeightOfBase64', () => {
    it('returns width and height of an image', () => {
      Image.mockImplementation(() => mockImg)
      const result = getWidthAndHeightOfBase64('base64')
      expect(result).toEqual([100, 200])
    })

    it('throws an error if the image is not valid', () => {
      Image.mockImplementation(() => {
        throw new Error('Invalid image')
      })
      expect(() => getWidthAndHeightOfBase64('base64')).toThrow('Invalid image')
    })
  })

  describe('imageToBase64', () => {
    it('converts an image to base64', () => {
      fs.readFileSync.mockReturnValue(mockFileData)

      const result = imageToBase64(mockFilePath)

      expect(fs.readFileSync).toBeCalledWith(mockFilePath, 'base64')
      expect(result).toEqual(`data:image/png;base64,${mockFileData}`)
    })
  })

  describe('parseCSV', () => {
    it('reads and parses a CSV file', async () => {
      const mockData = ['data1', 'data2', 'data3']

      // Mock the fs.createReadStream to return a stream-like object
      const mockStream = {
        pipe: jest.fn().mockReturnThis(),
        on: jest.fn().mockImplementation((event, handler) => {
          if (event === 'data') {
            mockData.forEach((data) => handler({ 0: data }))
          }

          if (event === 'end') {
            handler()
          }

          return mockStream
        }),
      }

      fs.createReadStream.mockReturnValue(mockStream)
      csv.mockReturnValue((inputStream) => inputStream)

      const result = await parseCSV(mockFilePath)

      expect(fs.createReadStream).toBeCalledWith(mockFilePath)
      expect(csv).toBeCalledWith({ headers: false })
      expect(result).toEqual(mockData)
    })

    it('rejects on error', async () => {
      const mockError = new Error('error')

      const mockStream = {
        pipe: jest.fn().mockReturnThis(),
        on: jest.fn().mockImplementation((event, handler) => {
          if (event === 'error') {
            handler(mockError)
          }

          return mockStream
        }),
      }

      fs.createReadStream.mockReturnValue(mockStream)

      await expect(parseCSV(mockFilePath)).rejects.toThrow(mockError)
    })
  })
})
