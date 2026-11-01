const fs = require('fs')
const path = require('path')
const fetch = require('node-fetch')

const outputDir = path.join(__dirname, 'SRT', 'ara-sirajtafseer')
const quranAPI = 'https://api.alquran.cloud/v1/quran/quran-uthmani'

function formatTime(seconds) {
  const ms = Math.floor((seconds % 1) * 1000)
  const total = Math.floor(seconds)
  const h = String(Math.floor(total / 3600)).padStart(2, '0')
  const m = String(Math.floor((total % 3600) / 60)).padStart(2, '0')
  const s = String(total % 60).padStart(2, '0')
  return `${h}:${m}:${s},${String(ms).padStart(3, '0')}`
}

async function main() {
  fs.mkdirSync(outputDir, { recursive: true })

  const res = await fetch(quranAPI)
  if (!res.ok) throw new Error(`Failed to fetch Quran: ${res.status}`)

  const json = await res.json()
  const surahs = json?.data?.surahs

  if (!surahs || !surahs.length) {
    throw new Error('No surahs found in Quran API response')
  }

  for (const surah of surahs) {
    const chapter = surah.number
    const ayahs = surah.ayahs

    if (!ayahs || !ayahs.length) {
      console.error(`No ayahs for chapter ${chapter}`)
      continue
    }

    const outFile = path.join(outputDir, `${chapter}.srt`)

    if (fs.existsSync(outFile)) {
      console.log(`Skipping ${chapter}.srt (already exists)`)
      continue
    }

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

  console.log('Finished generating all SRT files.')
}

main().catch(error => {
  console.error(error)
  process.exit(1)
})
