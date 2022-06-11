const cheerio = require('cheerio')
const fs = require('fs')
const moment = require('moment-timezone')

moment.locale('es-VE')

console.log('Starting...')

fs.rmdirSync('./output', { recursive: true })
fs.mkdirSync('./output')
fs.mkdirSync('./output/images')

const files = fs.readFileSync('files.txt', 'utf-8').split('\n').filter(Boolean)

let $
let numRec = 0
let numRecWithInfo = 0
let numFiles = 0
let content

for (const file of files) {
  $ = cheerio.load(fs.readFileSync('../wikieva-archive/web/' + file,{encoding:'utf8', flag:'r'}))
  extract(file)
  outputFile(file)
  if (content.imageUrl) {
    fs.copyFileSync('../wikieva-archive/web/' + content.imageUrl, './output/' + content.imageUrl)
    let imageUrlNoPrefix = content.imageUrl.replace('240px-', '')
    if (fs.existsSync('../wikieva-archive/web/' + imageUrlNoPrefix)) {
      fs.copyFileSync('../wikieva-archive/web/' + imageUrlNoPrefix, './output/' + imageUrlNoPrefix)
    }
  }
  if (content.distributionMapUrl) {
    fs.copyFileSync('../wikieva-archive/web/' + content.distributionMapUrl, './output/' + content.distributionMapUrl)
    let distributionMapUrlNoPrefix = content.distributionMapUrl.replace('240px-', '')
    if (fs.existsSync('../wikieva-archive/web/' + distributionMapUrlNoPrefix)) {
      fs.copyFileSync('../wikieva-archive/web/' + distributionMapUrlNoPrefix, './output/' + distributionMapUrlNoPrefix)
    }
  }
}
//$ = cheerio.load(fs.readFileSync('../wikieva-archive/web/lithogenes_valencia.html',{encoding:'utf8', flag:'r'}))
//$ = cheerio.load(fs.readFileSync('../wikieva-archive/web/ocyurus_chrysurus.html',{encoding:'utf8', flag:'r'}))
//extract('ocyurus_chrysurus.html')
//outputFile('ocyurus_chrysurus.html')

console.log('Finished')
console.log('Files processed:', numRec, 'Files with description:', numRecWithInfo, 'Files written:', numFiles)

//console.log(content)
//const $ = cheerio.load(fs.readFileSync('../wikieva-archive/web/batrochoglanis_mathisoni.html',{encoding:'utf8', flag:'r'}))
//const $ = cheerio.load(fs.readFileSync('../wikieva-archive/web/tapirus_pinchaque.html',{encoding:'utf8', flag:'r'}))
//const $ = cheerio.load(fs.readFileSync('../wikieva-archive/web/sylvilagus_brasiliensis.html',{encoding:'utf8', flag:'r'}))

function outputFile(file) {
  if (content.kingdom) { // If there is no kingdom, there is nothing
    numFiles++
    let f = './output/' + file.split('.')[0] + '.json'
    //console.log(f)
    fs.writeFileSync(f, JSON.stringify(content, null, 2))
  } else {
    console.log('Content ignored:', content.scientificName)
  }
}

function addToContent(field, fieldContent) {
  if (fieldContent) {
    content[field] = fieldContent
  }
}

function extract(file) {
  content = {}
  numRec++
  addToContent('originalFileName', file)
  addToContent('scientificName', $('#firstHeading').text())
  addToContent('commonName', $('th.cabecera').text().trim())
  addToContent('imageUrl', $('th.cabecera').parent().next().find('td>a>img').attr('src'))
  addToContent('risk', $('th:contains("Riesgo de extinción")').parent().next().find('td>a').eq(1).attr('title'))
  addToContent('kingdom', $('th:contains("Reino:")').next().text().trim())
  addToContent('phylum', $('th:contains("Filo:")').next().text().trim())
  addToContent('class', $('th:contains("Clase:")').next().text().trim())
  addToContent('order', $('th:contains("Orden:")').next().text().trim())
  addToContent('family', $('th:contains("Familia:")').next().text().trim())
  addToContent('genus', $('th:contains("Género:")').next().text().trim())
  addToContent('species', $('th:contains("Especie:")').next().text().trim())
  addToContent('binomialName', $('tr:contains("Nombre binomial")').next().find('span>i').text().trim())
  addToContent('binomialNameAuthor', $('tr:contains("Nombre binomial")').next().find('span').eq(1).text().trim())
  addToContent('distributionMapUrl', $('th:contains("Distribución")').parent().next().find('td>a>img').attr('src'))
  addToContent('regionalCategoryAndCriteria', $('li:contains("Categoría y Criterio Regional")').text().split(': ').pop().trim())
  addToContent('regionalEvaluationDate', $('li:contains("Fecha de Evaluación Regional")').text().split(': ').pop())
  addToContent('evaluators', $('li:contains("Evaluadores")').text().split(': ').pop())
  addToContent('globalCategoryAndCriteria', $('li:contains("Categoría y Criterio Global")').text().split(': ').pop())

  if ($('h2:contains("Justificación"),h3:contains("Justificación")').next().is('p')) {
    addToContent('justification', $('h2:contains("Justificación"),h3:contains("Justificación")').next().text())
  }
  let pE = []
  let p = $('h2:contains("Evaluaciones Previas"),h3:contains("Evaluaciones Previas")').next()
  while (p.is('p')) {
    pE.push(p.text().trim())
    p = p.next()
  }
  if (pE.length) addToContent('previousEvaluations', pE)

  if ($('h4:contains("Nombres comunes")').next().is('p')) {
    addToContent('commonNames', $('h4:contains("Nombres comunes")').next().text().trim())
  }

  if ($('h4:contains("Notas taxonómicas")').next().is('p')) {
    addToContent('taxonomyNotes', $('h4:contains("Notas taxonómicas")').next().html().trim())
  }

  if ($('h4:contains("Sinónimos")').next().is('p')) {
    addToContent('synonyms', $('h4:contains("Sinónimos")').next().text().trim())
  }

  if ($('h2:contains("Descripción"),h3:contains("Descripción")').next().is('p')) {
    numRecWithInfo++
    addToContent('description', $('h2:contains("Descripción"),h3:contains("Descripción")').next().html().trim())
  }

  if ($('h2:contains("Distribución"), h3:contains("Distribución")').next().is('p')) {
    addToContent('distribution', $('h2:contains("Distribución"), h3:contains("Distribución")').next().html().trim())
  }

  addToContent('system', $('li:contains("Sistema")').text().split(': ').pop())
  addToContent('bioregion', $('li:contains("Bioregión")').text().split(': ').pop())
  addToContent('altitudeRange', $('li:contains("Intervalo altitudinal")').text().split(': ').pop())
  addToContent('isEndemic', $('li:contains("Endémica")').text().split(': ').pop())

  let status = ''
  let n = $('h2:contains("Situación"), h3:contains("Situación")').next()
  while (n.is('p')) {
    if (status === '') {
      status = n.html().trim()
    } else {
      status += '<br>' + n.html().trim()
    }
    n = n.next()
  }
  addToContent('status', status)

  addToContent('EOO', $('li:contains("EOO (km2)")').text().split(': ').pop())
  addToContent('AOO', $('li:contains("AOO (km2)")').text().split(': ').pop())
  addToContent('populationTrend', $('li:contains("Tendencia Poblacional")').text().split(': ').pop())

  if ($('h2:contains("Amenazas"), h3:contains("Amenazas")').next().is('p')) {
    addToContent('threats', $('h2:contains("Amenazas"), h3:contains("Amenazas")').next().html().trim())
  }

  if ($('h2:contains("Conservación"), h3:contains("Conservación")').next().is('p')) {
    addToContent('conservation', $('h2:contains("Conservación"), h3:contains("Conservación")').next().html().trim())
  }

  addToContent('originalAuthors', $('h4:contains("Autores originales")').next().text().trim())

  if ($('h4:contains("Colaboradores")').next().is('p')) {
    addToContent('collaborators', $('h4:contains("Colaboradores")').next().text().trim())
  }

  if ($('h3:contains("Editores y Colaboradores")').next().is('p')) {
    addToContent('editorsAndCollaborators', $('h3:contains("Editores y Colaboradores")').next().text().trim())
  }

  addToContent('illustrator', $('h4:contains("Ilustrador")').next().text().trim())

  let refs = []
  $('h2:contains("Referencias"), h3:contains("Referencias")').next().children().each(function () {
    refs.push($(this).text().trim())
  })

  if (refs.length === 0) { // Try with paragraphs
    let r = $('h2:contains("Referencias"), h3:contains("Referencias")').next()
    while (r.is('p')) {
      refs.push(r.text().trim())
      r = r.next()
    }
  }

  if (refs.length) addToContent('references', refs)

  let dateInput = $('#footer-info-lastmod').text().split('vez el ').pop().trim().split(' a las ')

  addToContent('dateLastUpdated', moment.tz(dateInput[0] + ' ' + dateInput[1], 'DD MMM YYYY HH:mm', 'America/Caracas').format())
}
