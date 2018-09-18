#!/usr/bin/env node

const request = require('request-promise-native')
const fs = require('fs')
const path = require('path')

const apiConfig = {
  api_key: 'Yuidwhp8NdJluvBWp4_iS1fEA7kbDFq-',
  api_secret: 'pN9aSlIo3-1q6xklRXRX8WGvAz3yuFHT'
}

const referencePath = '/static/reference'
const workPath = path.join(__dirname, '..', referencePath)
const targetPath = path.join(__dirname, '..', '/src/pages/index/references.json')

async function __main__ () {
  const faceFiles = fs.readdirSync(workPath).map(file => ({
    referencePath: path.join(referencePath, file),
    path: path.join(workPath, file)
  }))
  const result = {}
  for (const {referencePath, path} of faceFiles) {
    const {faces: [{ face_token: faceToken }]} = await request.post({
      url: 'https://api-cn.faceplusplus.com/facepp/v3/detect',
      json: true,
      formData: {
        ...apiConfig,
        image_file: fs.createReadStream(path),
        attributes: ['gender', 'age', 'emotion', 'smiling']
      }
    })
    await request.post({
      url: ' https://api-cn.faceplusplus.com/facepp/v3/faceset/addface',
      form: {
        ...apiConfig,
        outer_id: 'yanyipk',
        face_tokens: 'face_tokens'
      }
    })
    console.log(faceToken)
    result[referencePath] = faceToken
  }
  fs.writeFileSync(targetPath, JSON.stringify(result))
}

__main__()
