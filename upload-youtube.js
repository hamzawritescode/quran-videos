const fs = require('fs')
const path = require('path')
const { google } = require('googleapis')

async function uploadVideo(filePath, title, description, tags = []) {
  const oauth2Client = new google.auth.OAuth2(
    process.env.YOUTUBE_CLIENT_ID,
    process.env.YOUTUBE_CLIENT_SECRET,
    'urn:ietf:wg:oauth:2.0:oob'
  )

  oauth2Client.setCredentials({
    refresh_token: process.env.YOUTUBE_REFRESH_TOKEN
  })

  const youtube = google.youtube({
    version: 'v3',
    auth: oauth2Client
  })

  const fileSize = fs.statSync(filePath).size

  const res = await youtube.videos.insert(
    {
      part: ['snippet', 'status'],
      requestBody: {
        snippet: {
          title,
          description,
          tags,
          categoryId: '27'
        },
        status: {
          privacyStatus: 'public',
          selfDeclaredMadeForKids: false
        }
      },
      media: {
        body: fs.createReadStream(filePath)
      }
    },
    {
      onUploadProgress: evt => {
        const progress = (evt.bytesRead / fileSize) * 100
        process.stdout.write(`Uploading: ${progress.toFixed(1)}%\r`)
      }
    }
  )

  console.log('\nUploaded video ID:', res.data.id)
  console.log('Video URL: https://youtu.be/' + res.data.id)
  return res.data.id
}

module.exports = { uploadVideo }
