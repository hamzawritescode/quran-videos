const fs = require('fs')
const path = require('path')
const {
  spawnSync
} = require('child_process')
const fetch = require('node-fetch')

// each index corresponds to 001.mp4 .. to n.mp4
// Duration of pixabay videos in seconds
const pixabayDuration = [18, 13, 41, 38, 28, 30, 11, 39, 20, 18, 30, 32, 30, 50]
// Duration by chapter wise in seconds
const chapDuration = [47, 7265, 4792, 4770, 3758, 4338, 4793, 1822, 3625, 2689, 2771, 2516, 1213, 1217, 955, 2531, 1988, 1997, 1273, 1628, 1570, 1767, 1487, 1959, 1177, 1967, 1672, 2033, 1358, 1161, 653, 477, 1596, 1040, 914, 964, 1146, 946, 1622, 1484, 1005, 972, 1021, 509, 597, 763, 721, 630, 386, 499, 408, 369, 371, 350, 560, 531, 743, 572, 600, 422, 268, 197, 239, 343, 322, 287, 406, 376, 359, 272, 259, 293, 239, 290, 217, 347, 258, 299, 244, 210, 145, 141, 239, 153, 178, 90, 86, 97, 239, 91, 68, 102, 49, 31, 49, 83, 53, 117, 55, 54, 82, 51, 14, 39, 28, 21, 35, 12, 36, 19, 26, 11, 19, 40]
const pixabayPath = path.join(__dirname, 'pixabay-videos')

const audioPath = path.join(__dirname, 'audios')

const audioUrl = 'https://download.quranicaudio.com/quran/mishaari_raashid_al_3afaasee/112.mp3'
const audioFile = path.join(audioPath, '112.mp3')

if (!fs.existsSync(audioFile)) {
  fs.mkdirSync(audioPath, { recursive: true })
  spawnSync('curl', ['-L', audioUrl, '-o', audioFile])
}

// stores the end result
const hardcodedSubPath = path.join(__dirname, 'output')

const subtitlesPath = path.join(__dirname, 'subtitles')
// stores the uploaded link in edition file name
const uploadLinkPath = path.join(__dirname, 'uploaded')

// stores the editions to be added priority wise
const editionsList = ['ara-sirajtafseer']

// keep track of where to start
const stateFile = path.join(__dirname, 'state.txt')

// Max videos to upload daily
const maxuploads = 80
// No of subtitles to upload concurrently
const maxSubUpload = 20
let uploaded

let email, pass, recovery
if (process.env.CI) {
  email = process.env.user
  pass = process.env.key
  recovery = process.env.recovery
} else {
  [email, pass, recovery] = fs.readFileSync(path.join(__dirname, 'config.ini')).toString().split(/\r?\n/).map(e => e.trim())
}

const apiLink = 'https://cdn.jsdelivr.net/gh/fawazahmed0/quran-api@1'
const editionsLink = apiLink + '/editions'

// browser related values
let browser, page
const height = 1024
const width = 1280
const timeout = 60000

const uploadURL = 'https://www.youtube.com/upload'
const studioURL = 'https://studio.youtube.com'

const metadataPath = path.join(__dirname, 'metadata')
const titlePath = path.join(metadataPath, 'titles')
// Translated tags & description
const tagsPath = path.join(metadataPath, 'tags.json')
const tagsJSON = readJSON(tagsPath)
const descriptionPath = path.join(metadataPath, 'description.json')
const descriptionJSON = readJSON(descriptionPath)
// Youtube dropdown languages
let ytLangs = ['Abkhazian', 'Afar', 'Afrikaans', 'Akan', 'Albanian', 'American Sign Language', 'Amharic', 'Arabic', 'Aramaic', 'Armenian', 'Assamese', 'Aymara', 'Azerbaijani', 'Bangla', 'Bashkir', 'Basque', 'Belarusian', 'Bhojpuri', 'Bislama', 'Bosnian', 'Breton', 'Bulgarian', 'Burmese', 'Cantonese', 'Cantonese (Hong Kong)', 'Catalan', 'Cherokee', 'Chinese', 'Chinese (China)', 'Chinese (Hong Kong)', 'Chinese (Simplified)', 'Chinese (Singapore)', 'Chinese (Taiwan)', 'Chinese (Traditional)', 'Choctaw', 'Corsican', 'Croatian', 'Czech', 'Danish', 'Dutch', 'Dutch (Belgium)', 'Dutch (Netherlands)', 'Dzongkha', 'English', 'English (Canada)', 'English (India)', 'English (Ireland)', 'English (United Kingdom)', 'English (United States)', 'Esperanto', 'Estonian', 'Faroese', 'Fijian', 'Filipino', 'Finnish', 'French', 'French (Belgium)', 'French (Canada)', 'French (France)', 'French (Switzerland)', 'Fulah', 'Galician', 'Georgian', 'German', 'German (Austria)', 'German (Germany)', 'German (Switzerland)', 'Greek', 'Guarani', 'Gujarati', 'Haitian Creole', 'Hakka Chinese', 'Hakka Chinese (Taiwan)', 'Hausa', 'Hebrew', 'Hindi', 'Hindi (Latin)', 'Hiri Motu', 'Hungarian', 'Icelandic', 'Igbo', 'Indonesian', 'Interlingua', 'Interlingue', 'Inuktitut', 'Inupiaq', 'Irish', 'Italian', 'Japanese', 'Javanese', 'Kalaallisut', 'Kannada', 'Kashmiri', 'Kazakh', 'Khmer', 'Kinyarwanda', 'Klingon', 'Korean', 'Kurdish', 'Kyrgyz', 'Lao', 'Latin', 'Latvian', 'Lingala', 'Lithuanian', 'Luxembourgish', 'Macedonian', 'Malagasy', 'Malay', 'Malayalam', 'Maltese', 'Manipuri', 'Maori', 'Marathi', 'Masai', 'Min Nan Chinese', 'Min Nan Chinese (Taiwan)', 'Mizo', 'Mongolian', 'Nauru', 'Navajo', 'Nepali', 'Norwegian', 'Occitan', 'Odia', 'Oromo', 'Pashto', 'Persian', 'Persian (Afghanistan)', 'Persian (Iran)', 'Polish', 'Portuguese', 'Portuguese (Brazil)', 'Portuguese (Portugal)', 'Punjabi', 'Quechua', 'Romanian', 'Romanian', 'Romansh', 'Rundi', 'Russian', 'Russian (Latin)', 'Samoan', 'Sango', 'Sanskrit', 'Sardinian', 'Scottish Gaelic', 'Serbian', 'Serbian (Cyrillic)', 'Serbian (Latin)', 'Serbian (Latin)', 'Sherdukpen', 'Shona', 'Sicilian', 'Sindhi', 'Sinhala', 'Slovak', 'Slovenian', 'Somali', 'Southern Sotho', 'Spanish', 'Spanish (Latin America)', 'Spanish (Mexico)', 'Spanish (Spain)', 'Spanish (United States)', 'Sundanese', 'Swahili', 'Swati', 'Swedish', 'Tajik', 'Tamil', 'Tatar', 'Telugu', 'Thai', 'Tibetan', 'Tigrinya', 'Tok Pisin', 'Tongan', 'Tsonga', 'Tswana', 'Turkish', 'Turkmen', 'Ukrainian', 'Urdu', 'Uzbek', 'Vietnamese', 'Volapük', 'Võro', 'Welsh', 'Western Frisian', 'Wolof', 'Xhosa', 'Yiddish', 'Yoruba', 'Zulu']
ytLangs = ytLangs.map(e => e.toLowerCase())

// Stores the playlist option to select
let playlistToSelect
// stores the editionName, which is being uploaded
let editionName

// stores the pixavideos index thats needs to be ignored, as they are distracting
const ignorePixaVidIndex = [4, 7, 9, 11]
// Stores the list of chapters which needs to be reuploaded due to error etc
const redoChapters = []

// hardcodetime/video duration ratio for each pixa video
const videoTimeRatio = [0.1751304347826087, 1.789804347826087, 0.5999347826086957, 0.34145652173913044, 0.1971304347826087, 0.22706521739130434, 0.21043478260869566, 0.17365217391304347, 0.1945, 0.22604347826086957, 0.2111086956521739, 0.773804347826087, 0.20578260869565218, 0.1725]

// Stores the beginning time
const beginTime = new Date().getTime()

// Actions job timelimit of 6 hours
const sixHoursMillis = 21600000
// Slack for job timelimit for eighty minutes
const eightyMinsMillis = 4800000
// max duration with slack, i.e 4hours 40mins
const maxDuration = sixHoursMillis - eightyMinsMillis

const maxTitleLen = 100
const maxDescLen = 5000

// Youtube dropdown Language names to Edition Language names mappings for not similar names
const ytToEditionLang = {
  pashto: 'pushto',
  uyghur: 'uighur',
  punjabi: 'panjabi',
  kyrgyz: 'kirghiz',
  kurdish: 'kurmanji',
  'Southern Sotho': 'sotho',
  'Chinese (Simplified)': 'chinese(simplified)',
  'Chinese (Traditional)': 'chinese(traditional)'
}

// Google translate Language names to Edition Language names mappings for not similar names
const gTransToEditionLang = {
  'myanmar(burmese)': 'burmese',
  pashto: 'pushto',
  uyghur: 'uighur',
  punjabi: 'panjabi',
  kyrgyz: 'kirghiz',
  'kurdish(kurmanji)': 'kurmanji',
  sesotho: 'sotho'
}
// Holds Edition name to Edition Language mapping
let edHolder

// youtube dropdown to edition name mappings
const submapped = {
  'Chinese (China)': 'zho-mazhonggang',
  'Chinese (Hong Kong)': 'zho-muhammadmakin',
  'Chinese (Simplified)': 'zho-majian',
  'Chinese (Singapore)': 'zho-muhammadmakin-la',
  'Chinese (Taiwan)': 'zho-majian1',
  'Chinese (Traditional)': 'zho-anonymousgroupo',
  'Dutch (Belgium)': 'nld-fredleemhuis',
  'Dutch (Netherlands)': 'nld-salomokeyzer',
  'English (Canada)': 'eng-muhammadasad',
  'English (India)': 'eng-miraneesuddin',
  'English (Ireland)': 'eng-themonotheistgr',
  'English (United Kingdom)': 'eng-thestudyquran',
  'English (United States)': 'eng-safikaskas',
  'French (Belgium)': 'fra-islamicfoundati',
  'French (Canada)': 'fra-muhammadhameedu',
  'French (France)': 'fra-shahnazsaidiben',
  'French (Switzerland)': 'fra-muhammadhamidul',
  Kyrgyz: 'kir-shamsaldinhakim',
  'German (Austria)': 'deu-aburidamuhammad',
  'German (Germany)': 'deu-adeltheodorkhou',
  'German (Switzerland)': 'deu-amirzaidan',
  'Hindi (Latin)': 'hin-suhelfarooqkhan-la',
  Pashto: 'pus-abdulwalikhan',
  'Persian (Afghanistan)': 'fas-abdolmohammaday',
  'Persian (Iran)': 'fas-abolfazlbahramp',
  'Portuguese (Brazil)': 'por-helminasr',
  'Portuguese (Portugal)': 'por-samirelhayek',
  Punjabi: 'pan-drmuhamadhabibb',
  'Russian (Latin)': 'rus-abuadel-la',
  'Southern Sotho': 'sot-sheikheliaskeke',
  'Spanish (Latin America)': 'spa-abdulqadermouhe',
  'Spanish (Mexico)': 'spa-juliocortes',
  'Spanish (Spain)': 'spa-islamicfoundati',
  'Spanish (United States)': 'spa-muhammadasadabd',
  Bangla: 'ben-abubakrzakaria',
  Afar: 'aar-sheikhmahmoudab',
  Afrikaans: 'afr-imammabaker',
  Albanian: 'sqi-unknown',
  Amharic: 'amh-muhammedsadiqan',
  Arabic: 'ara-sirajtafseer',
  Assamese: 'asm-shaykhrafeequli',
  Azerbaijani: 'aze-vasimmammadaliy',
  Bosnian: 'bos-wwwislamhouseco',
  Bulgarian: 'bul-tzvetantheophan',
  Burmese: 'mya-hashimtinmyint',
  Catalan: 'cat-yousseflyoussi',
  Croatian: 'hrv-unknown',
  Czech: 'ces-prekladihrbek',
  Danish: 'dan-vandetaal',
  Dutch: 'nld-unknown',
  English: 'eng-wahiduddinkhan',
  Esperanto: 'epo-hadiabdollahian',
  Finnish: 'fin-unknown',
  French: 'fra-shahnazsaidiben',
  German: 'deu-frankbubenheima',
  Gujarati: 'guj-rabilaalomari',
  Hausa: 'hau-abubakarmahmoud',
  Hebrew: 'heb-unknown',
  Hindi: 'hin-suhelfarooqkhan',
  Hungarian: 'hun-drahmedabdelrah',
  Indonesian: 'ind-unknown',
  Italian: 'ita-hamzarobertopic',
  Japanese: 'jpn-ryoichimita',
  Javanese: 'jav-unknown',
  Kannada: 'kan-abdussalamputhi',
  Kazakh: 'kaz-khalifahaltaich',
  Khmer: 'khm-cambodianmuslim',
  Kinyarwanda: 'kin-rmcrwanda',
  Korean: 'kor-unknown',
  Kurdish: 'kur-muhammadsalehba',
  Latin: 'lat-hadiabdollahian',
  Macedonian: 'mkd-sheikhhassangil',
  Malay: 'msa-abdullahmuhamma',
  Malayalam: 'mal-muhammadkarakun',
  Maltese: 'mlt-martinrzammitmu',
  Marathi: 'mar-muhammadshafiia',
  Nepali: 'nep-ahlalhadithcent',
  Norwegian: 'nor-einarberg',
  Oromo: 'orm-ghaliapapurapag',
  Persian: 'fas-unknown',
  Polish: 'pol-jozefabielawski',
  Portuguese: 'por-samirelhayek',
  Romanian: 'ron-unknown',
  Rundi: 'run-sheikhamissirad',
  Russian: 'rus-vporokhova',
  Shona: 'sna-abdullahjmadini',
  Sindhi: 'snd-tajmehmoodamrot',
  Sinhala: 'sin-wwwislamhouseco',
  Slovak: 'slk-hadiabdollahian',
  Somali: 'som-shaykhmahmoodmu',
  Spanish: 'spa-raulgonzalezbor',
  Swahili: 'swa-alimuhsinalbarw',
  Swedish: 'swe-knutbernstrom',
  Tajik: 'tgk-wwwislamhouseco',
  Tamil: 'tam-janturstfoundat',
  Tatar: 'tat-yakubibnnugman',
  Telugu: 'tel-abdulraheemmoha',
  Thai: 'tha-kingfahadquranc',
  Turkish: 'tur-ynozturk',
  Ukrainian: 'ukr-yakubovych',
  Urdu: 'urd-syedzeeshanhaid',
  Uzbek: 'uzb-muhammadsodikmu',
  Vietnamese: 'vie-hassanabdulkari',
  Xhosa: 'xho-imaamismaaeelng',
  Yoruba: 'yor-shaykhaburahima',
  Zulu: 'zul-iqembulezifundi',
  Filipino: 'fil-wwwislamhouseco'
}

// make hardcodedsubtitle vidoe output directory if it doesn't exist
fs.mkdirSync(hardcodedSubPath, {
  recursive: true
})
// make uploadedlink path, which will save the editions uploaded youtube links
fs.mkdirSync(uploadLinkPath, {
  recursive: true
})

// capitalizes all the first letters in a sentense
const capitalize = words => words.split(' ').map(w => w[0].toUpperCase() + w.substring(1)).join(' ')
// generate random video larger than chapter
async function generateVideos () {
  const [editionsJSON] = await getLinksJSON([editionsLink + '.json'])
  // Holds subtitle uploading promises
  let subPromiseHolder = []
  // Edition name to Edition Language mapping
  edHolder = {}
  for (const value of Object.values(editionsJSON)) { edHolder[value.name] = value.language }

  const pixabayFiles = fs.readdirSync(pixabayPath).sort()
  let chap, day;
  [editionName, chap, playlistToSelect, uploaded, day] = getState()
  chap = parseInt(chap)

  // if today is different date, then the upload limits don't count
  if (day != new Date().toISOString().substring(8, 10)) { uploaded = 0 }

  const editionLang = edHolder[editionName].toLowerCase()

  for (;chap <= 114; chap++) {
    console.log('beginning for chapter ', chap)
    // Save the current chap & edition state, to recover from here in case of error
    saveState(editionName, chap)

    const currentDuration = new Date().getTime() - beginTime

    const remainingDuration = maxDuration - currentDuration

    const currChapDuration = chapDuration[chap] * 1000

    // stores the pixavideos index that needs to be used
    let allowedPixaVidIndex
    // if chapter size is bigger, then ignore 1st and 2nd index of pixavids also,as they are of huge size
    if (chap < 30) { allowedPixaVidIndex = [...Array(pixabayFiles.length).keys()].filter(e => !ignorePixaVidIndex.concat(1, 2).includes(e)) } else { allowedPixaVidIndex = [...Array(pixabayFiles.length).keys()].filter(e => !ignorePixaVidIndex.includes(e)) }

    const randomIndex = getRandomNo(allowedPixaVidIndex.length)
    const randomNo = allowedPixaVidIndex[randomIndex]
    // stop if uploaded files had reached the youtube upload limit or
    // remaining duration is not enought to hardcode the subtitles & upload
    if (uploaded >= maxuploads || remainingDuration < currChapDuration * videoTimeRatio[randomNo]) { break }
    console.log('selected pixabay video index is ', randomNo)
    // Pixabay Videos to use for recitation
    const pixaFileWithPath = path.join(pixabayPath, pixabayFiles[randomNo])

    // Increase the video size to more than chapter duration
    const repeat = Math.ceil(chapDuration[chap - 1] / pixabayDuration[randomNo])

    const paddedI = (chap + '').padStart(3, '0')
    const fileSavePath = path.join(hardcodedSubPath, paddedI + '.mp4')
    spawnSync('ffmpeg', ['-stream_loop', repeat, '-i', pixaFileWithPath, '-i', path.join(audioPath, paddedI + '.mp3'), '-vf', 'subtitles=subtitles/' + editionName + '/' + chap + ".srt:force_style='Alignment=2,OutlineColour=&H100000000,BorderStyle=3,Outline=1,Shadow=0,Fontsize=18,MarginL=0,MarginV=60'", '-crf', '18', '-vcodec', 'libx264', '-preset', 'ultrafast', '-map', '0:v', '-map', '1:a', '-c:a', 'copy', '-shortest', fileSavePath])
    console.log('before uploading the video for chapter ', chap)

    let title = await uploadVideo(fileSavePath, editionLang, chap)
    console.log('Uploading completed for ', chap)

    uploaded++

    // Keep the test video instead of deleting it
    // fs.unlinkSync(fileSavePath)

    // Delete temp directory in actions
    if (process.env.CI) {
      fs.rmdirSync(process.env.tempdir, {
        recursive: true
      })
      fs.mkdirSync(process.env.tempdir, {
        recursive: true
      })
    }
    // if subtitles promise holder has reached max subtitles uploads, then wait for all of them to complete
    if (subPromiseHolder.length === maxSubUpload) {
      await Promise.all(subPromiseHolder)
      subPromiseHolder = []
    }
  }

  // wait for all remaining subtitles upload  to complete
  await Promise.all(subPromiseHolder)

  const editionIndex = editionsList.indexOf(editionName)
  // if all the chapters are uploaded, then save new edition & chapter 1
  if (chap > 114) { saveState(editionsList[editionIndex + 1], 1) }
}

async function begin () {
  await generateVideos()
}

begin()

// get the yesterdays state, so to continue uploading
function getState () {
  return fs.readFileSync(stateFile).toString().split(/\r?\n/)
}

// save the state
function saveState (editionNameArg, chap) {
  fs.writeFileSync(stateFile, editionNameArg + '\n' + chap + '\n' + playlistToSelect + '\n' + uploaded + '\n' + new Date().toISOString().substring(8, 10))
}

// Generates random number
function getRandomNo (max) {
  return Math.floor(Math.random() * Math.floor(max))
}

function getKeyByValue (obj, value) {
  return Object.keys(obj).find(key => obj[key].toLowerCase() === value.toLowerCase())
}

// context and browser is a global variable and it can be accessed from anywhere
// function that launches a browser
async function launchBrowser () {
  const launchOptions = { headless: true }

  if (process.env.CI) {
    launchOptions.args = ['--no-sandbox', '--disable-setuid-sandbox']
  }

  browser = await puppeteer.launch(launchOptions)
  page = await browser.newPage()
  await page.setDefaultTimeout(timeout)
  await page.setViewport({ width: width, height: height })
}

// Login bypass with recovery email
async function securityBypass (localPage) {
  try {
    const confirmRecoveryXPath = '//*[normalize-space(text())=\'Confirm your recovery email\']'
    await localPage.waitForXPath(confirmRecoveryXPath)

    const confirmRecoveryBtn = await localPage.$x(confirmRecoveryXPath)
    await localPage.evaluate(el => el.click(), confirmRecoveryBtn[0])
  } catch (error) {
    console.log('confirm your recovery email button not found')
    console.error(error)
  }

  try {
    const enterRecoveryXPath = '//*[normalize-space(text())=\'Enter recovery email address\']'
    await localPage.waitForXPath(enterRecoveryXPath)
    await localPage.type('input[type="email"]', recovery)
    await localPage.keyboard.press('Enter')
    await localPage.waitForNavigation({
      waitUntil: 'networkidle0'
    })
    const selectBtnXPath = '//*[normalize-space(text())=\'Select files\']'
    await localPage.waitForXPath(selectBtnXPath)
  } catch (error) {
    console.log('Login Failed in securityBypass')
    console.error(error)
  }
}

async function login (localPage) {
  await localPage.goto(uploadURL)
  await localPage.waitForSelector('input[type="email"]')
  await localPage.type('input[type="email"]', email)
  await localPage.keyboard.press('Enter')
  await localPage.waitForNavigation({
    waitUntil: 'networkidle0'
  })

  await localPage.waitForXPath('//*[normalize-space(text())=\'Show password\']')
  await localPage.type('input[type="password"]', pass)

  await localPage.keyboard.press('Enter')

  await localPage.waitForNavigation()

  try {
    const selectBtnXPath = '//*[normalize-space(text())=\'Select files\']'
    await localPage.waitForXPath(selectBtnXPath, { timeout: 60000 })
  } catch (error) {
    console.log('Login failed, have to try securtiy bypass')
    console.error(error)
    await securityBypass(localPage)
  }
}

function readJSON (pathToJSON) {
  const jsonStr = fs.readFileSync(pathToJSON).toString()
  return JSON.parse(jsonStr)
}

// [https://www.shawntabrizi.com/code/programmatically-fetch-multiple-apis-parallel-using-async-await-javascript/](https://www.shawntabrizi.com/code/programmatically-fetch-multiple-apis-parallel-using-async-await-javascript/)
// Get links async i.e in parallel
async function getLinksJSON (urls) {
  return await Promise.all(
    urls.map(url => fetch(url).then(response => response.json()))
  ).catch(console.error)
}

// Temporary upload function for the first test
async function uploadVideo (pathToFile, lang, chapter) {
  console.log('Video created successfully:', pathToFile)
  console.log('YouTube API upload will be added next.')
  return 'Test Video'
}

async function sleep (ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

async function getSubLink (title) {
  console.log('Skipping subtitle link lookup in test mode.')
  return ''
}

// upload the subtitles
async function uploadSub (chapter, subLink) {
  console.log('Skipping subtitle upload in test mode.')
}

// subtitles upload
async function subPart (pathToFile, localPage) {
  console.log('Skipping subtitle part in test mode.')
}

// Add title & description in subtitles pages
async function titleDescPart (title, desc, localPage) {
  console.log('Skipping title and description in test mode.')
}

// Select new language
async function addNewLang (langVal, localPage) {
  console.log('Skipping language selection in test mode.')
}
