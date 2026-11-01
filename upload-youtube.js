const fs = require('fs')
const path = require('path')
const { google } = require('googleapis')

const videoPath = path.join(__dirname, 'output', '112.mp4')

if (!fs.existsSync(videoPath)) {
  console.error('Video not found:', videoPath)
  process.exit(1)
}

async function uploadVideo() {
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

  const res = await youtube.videos.insert({
    part: ['snippet', 'status'],
    requestBody: {
      snippet: {
        title: 'Surah Al-Ikhlas | سورة الإخلاص',
        description: 'Recitation of Surah Al-Ikhlas with Arabic translation.\n\nتلاوة سورة الإخلاص مع الترجمة العربية.',
        tags: ['Quran', 'القرآن', 'سورة الإخلاص', 'Al-Ikhlas', 'تلاوة'],
        categoryId: '27'
      },
      status: {
        privacyStatus: 'public',
        selfDeclaredMadeForKids: false
      }
    },
    media: {
      body: fs.createReadStream(videoPath)
    }
  })

  console.log('Uploaded video ID:', res.data.id)
  console.log('Video URL: https://youtu.be/' + res.data.id)
}

uploadVideo().catch(error => {
  console.error('Upload failed:')
  console.error(error.response ? error.response.data : error)
  process.exit(1)
})
