const fs = require('fs')
const path = require('path')
const fetch = require('node-fetch')

const outputDir = path.join(__dirname, 'SRT', 'ara-sirajtafseer')
const apiLink = 'https://cdn.jsdelivr.net/gh/fawazahmed0/quran-api@1'

function formatTime(seconds) {
  const ms = Math.floor((seconds % 1) * 1000)
  const total = Math.floor(seconds)
  const h = String(Math.floor(total / 3600)).padStart(2, '0')
  const m = String(Math.floor((total % 3600) / 60)).padStart(2, '0')
  const s = String(total % 60).padStart(2, '0')
  return `${h}:${m}:${s},${String(ms).padStart(3, '0')}`
}

async function getJSON(url) {
  const res = await fetch(url)
  if (!res.ok) throw new Error(`Failed to fetch ${url}: ${res.status}`)
  return res.json()
}

async function generateChapter(chapter) {
  const padded = String(chapter).padStart(3, '0')
  const outFile = path.join(outputDir, `${chapter}.srt`)

  if (fs.existsSync(outFile)) {
    console.log(`Skipping ${chapter}.srt (already exists)`)
    return
  }

  const verses = await getJSON(`${apiLink}/editions/ara-sirajtafseer/${chapter}.json`)
  const ayahs = verses.ayahs

  if (!ayahs || !ayahs.length) {
    throw new Error(`No ayahs found for chapter ${chapter}`)
  }

  // تقسيم زمني بسيط: كل آية تحصل على مدة حسب طولها
  const totalChars = ayahs.reduce((sum, a) => sum + a.text.length, 0)
  const totalDuration = 30 + ayahs.length * 6

  let currentTime = 0
  let srt = ''

  ayahs.forEach((ayah, index) => {
    const share = ayah.text.length / totalChars
    const duration = Math.max(3, totalDuration * share)
    const start = currentTime
    const end = currentTime + duration
    currentTime = end

    srt += `${index + 1}\n`
    srt += `${formatTime(start)} --> ${formatTime(end)}\n`
    srt += `${ayah.text}\n\n`
  })

  fs.writeFileSync(outFile, srt, 'utf8')
  console.log(`Created ${chapter}.srt with ${ayahs.length} ayahs`)
}

async function main() {
  fs.mkdirSync(outputDir, { recursive: true })

  for (let chapter = 1; chapter <= 114; chapter++) {
    try {
      await generateChapter(chapter)
    } catch (error) {
      console.error(`Failed chapter ${chapter}:`, error.message)
    }
  }

  console.log('Finished generating all SRT files.')
}

main()
