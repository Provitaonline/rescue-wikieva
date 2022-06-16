const cheerio = require('cheerio')
const fs = require('fs')
const moment = require('moment-timezone')

moment.locale('es-VE')

console.log('Starting...')

fs.rmdirSync('./output', { recursive: true })
fs.mkdirSync('./output')
fs.mkdirSync('./output/images')
fs.mkdirSync('./output/taxonomy')

const files = fs.readFileSync('files.txt', 'utf-8').split('\n').filter(Boolean)

let $
let numRec = 0
let numRecWithInfo = 0
let numFiles = 0
let content
let riskStats = {}
let taxonomy = {}

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

fs.writeFileSync('./output/taxonomy/taxonomy.json', JSON.stringify(taxonomy, null, 2))
copyExtras()

console.log('Finished processing')
console.log('Files read:', numRec, 'Files with description:', numRecWithInfo, 'Files written:', numFiles)
console.log('Risk stats:', riskStats)

function copyExtras() {
  const filesToCopy = [
    '50px-bolita_cr.svg.png',
    '50px-bolita_dd.svg.png',
    '50px-bolita_en.svg.png',
    '50px-bolita_er.svg.png',
    '50px-bolita_ew.svg.png',
    '50px-bolita_ex.svg.png',
    '50px-bolita_lc.svg.png',
    '50px-bolita_na.svg.png',
    '50px-bolita_ne.svg.png',
    '50px-bolita_nt.svg.png',
    '50px-bolita_vu.svg.png',
    'status_er.svg',
    'status_iucn3.1_cr_es.svg',
    'status_iucn3.1_en_es.svg',
    'status_iucn3.1_lc_es.svg',
    'status_iucn3.1_nt_es.svg',
    'status_iucn3.1_vu_es.svg',
    'status_ne.svg',
    'status_none_dd.svg',
    'status_none_ex.svg'
  ]

  for (const f of filesToCopy) {
    fs.copyFileSync('../wikieva-archive/web/images/' + f, './output/images/' + f)
  }
}

function outputFile(file) {
  if (Object.keys(content).length === 0) {
    // console.log('Content ignored:', file)
  } else {
    numFiles++
    let f = './output/' + file.split('.')[0] + '.json'
    fs.writeFileSync(f, JSON.stringify(content, null, 2))
    collectTaxonomy(file)
  }
}

function collectTaxonomy(file) {

  if (!taxonomy[content.kingdom]) taxonomy[content.kingdom] = {}
  if (!taxonomy[content.kingdom][content.phylum]) taxonomy[content.kingdom][content.phylum] = {}
  if (!taxonomy[content.kingdom][content.phylum][content.class]) taxonomy[content.kingdom][content.phylum][content.class] = {}
  if (!taxonomy[content.kingdom][content.phylum][content.class][content.order]) taxonomy[content.kingdom][content.phylum][content.class][content.order] = {}
  if (!taxonomy[content.kingdom][content.phylum][content.class][content.order][content.family]) taxonomy[content.kingdom][content.phylum][content.class][content.order][content.family] = {}
  if (!taxonomy[content.kingdom][content.phylum][content.class][content.order][content.family][content.genus]) taxonomy[content.kingdom][content.phylum][content.class][content.order][content.family][content.genus] = {}

  taxonomy[content.kingdom][content.phylum][content.class][content.order][content.family][content.genus][content.binomialName] = {
    jsonFile: file.split('.')[0] + '.json',
    hasDescription: content.description != undefined,
    risk: content.risk
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

  // Reject empty pages
  if ($('.noarticletext:contains("Actualmente no hay texto en esta página.")').text()) return
  // Reject empty kingdom
  if ($('th:contains("Reino:")').next().eq(0).text().trim() === '') return

  addToContent('originalFileName', file)
  addToContent('scientificName', $('#firstHeading').text())
  addToContent('commonName', $('th.cabecera').text().trim())
  addToContent('imageUrl', $('th.cabecera').parent().next().find('td>a>img').attr('src'))
  addToContent('risk', $('th:contains("Riesgo de extinción")').parent().next().find('td>a').eq(1).attr('title'))

  if (content.risk === undefined) {
    content.risk = 'Datos Insuficientes'
  }
  if (content.risk in riskStats) {
    riskStats[content.risk]++
  } else {
    riskStats[content.risk] = 1
  }

  addToContent('kingdom', $('th:contains("Reino:")').next().eq(0).text().trim().replace(/'/g, ''))
  addToContent('phylum', $('th:contains("Filo:")').next().eq(0).text().trim().replace(/'/g, ''))
  addToContent('class', $('th:contains("Clase:")').next().eq(0).text().trim().replace(/'/g, ''))
  addToContent('order', $('th:contains("Orden:")').next().eq(0).text().trim().replace(/'/g, ''))
  addToContent('family', $('th:contains("Familia:")').next().eq(0).text().trim().replace(/'/g, ''))
  addToContent('genus', $('th:contains("Género:")').next().eq(0).text().trim().replace(/'/g, ''))
  addToContent('species', $('th:contains("Especie:")').next().eq(0).text().trim().replace(/'/g, ''))
  addToContent('binomialName', $('tr:contains("Nombre binomial")').next().find('span>i').text().trim())
  if (content.binomialName === undefined) content.binomialName = content.scientificName
  addToContent('binomialNameAuthor', $('tr:contains("Nombre binomial")').next().find('span').eq(1).text().trim())
  addToContent('distributionMapUrl', $('th:contains("Distribución")').parent().next().find('td>a>img').attr('src'))
  addToContent('regionalCategoryAndCriteria', $('li:contains("Categoría y Criterio Regional")').text().split(': ').pop().trim())
  addToContent('regionalEvaluationDate', $('li:contains("Fecha de Evaluación Regional")').text().split(': ').pop().trim())
  addToContent('evaluators', $('li:contains("Evaluadores")').text().split(': ').pop().trim())
  addToContent('globalCategoryAndCriteria', $('li:contains("Categoría y Criterio Global")').text().split(': ').pop().trim())

  if ($('h2:contains("Justificación"),h3:contains("Justificación")').next().is('p')) {
    addToContent('justification', $('h2:contains("Justificación"),h3:contains("Justificación")').next().text().trim())
  }
  let pE = []
  let p = $('h2:contains("Evaluaciones Previas"),h3:contains("Evaluaciones Previas")').next()
  while (p.is('p')) {
    pE.push(p.text().trim())
    p = p.next()
  }
  if (pE.length) addToContent('previousEvaluations', pE)

  if ($('h4:contains("Nombres comunes")').next().is('p')) {
    addToContent('commonNames', $('h4:contains("Nombres comunes")').next().html().trim())
  }

  if ($('h4:contains("Notas taxonómicas")').next().is('p')) {
    addToContent('taxonomyNotes', $('h4:contains("Notas taxonómicas")').next().html().trim())
  }

  if ($('h4:contains("Sinónimos")').next().is('p')) {
    addToContent('synonyms', $('h4:contains("Sinónimos")').next().html().trim())
  }

  if ($('h2:contains("Descripción"),h3:contains("Descripción")').next().is('p')) {
    numRecWithInfo++
    addToContent('description', $('h2:contains("Descripción"),h3:contains("Descripción")').next().html().trim())
  }

  if ($('h2:contains("Distribución"), h3:contains("Distribución")').next().is('p')) {
    addToContent('distribution', $('h2:contains("Distribución"), h3:contains("Distribución")').next().html().trim())
  }

  addToContent('system', $('li:contains("Sistema:")').text().split(': ').pop().trim())
  addToContent('bioregion', $('li:contains("Bioregión:")').text().split(': ').pop().trim())
  addToContent('altitudeRange', $('li:contains("Intervalo altitudinal (m):")').text().split(': ').pop().trim())
  addToContent('isEndemic', $('li:contains("Endémica:")').text().split(': ').pop().trim())

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

  addToContent('EOO', $('li:contains("EOO (km2)")').text().split(': ').pop().trim())
  addToContent('AOO', $('li:contains("AOO (km2)")').text().split(': ').pop().trim())
  addToContent('populationTrend', $('li:contains("Tendencia Poblacional")').text().split(': ').pop().trim())

  if ($('h2:contains("Amenazas"), h3:contains("Amenazas")').next().is('p')) {
    addToContent('threats', $('h2:contains("Amenazas"), h3:contains("Amenazas")').next().html().trim())
  }

  if ($('h2:contains("Conservación"), h3:contains("Conservación")').next().is('p')) {
    addToContent('conservation', $('h2:contains("Conservación"), h3:contains("Conservación")').next().html().trim())
  }

  if ($('h4:contains("Autores originales")').next().is('p')) {
    addToContent('originalAuthors', $('h4:contains("Autores originales")').next().text().trim())
  }

  if ($('h4:contains("Colaboradores")').next().is('p')) {
    addToContent('collaborators', $('h4:contains("Colaboradores")').next().text().trim())
  }

  if ($('h3:contains("Editores y Colaboradores")').next().is('p')) {
    addToContent('editorsAndCollaborators', $('h3:contains("Editores y Colaboradores")').next().text().trim())
  }

  if ($('h4:contains("Ilustrador")').next().is('p')) {
    addToContent('illustrator', $('h4:contains("Ilustrador")').next().text().trim())
  }

  let refs = []
  let r = $('h2:contains("Referencias"), h3:contains("Referencias")').next()
  while (r.is('ul')) { // There might be more than one list!
    r.children().each(function () {
      refs.push($(this).html().trim())
    })
    r = r.next()
  }

  if (refs.length === 0) { // Try with paragraphs
    r = $('h2:contains("Referencias"), h3:contains("Referencias")').next()
    while (r.is('p')) {
      refs.push(r.html().trim())
      r = r.next()
    }
  }

  if (refs.length) addToContent('references', refs)

  let dateInput = $('#footer-info-lastmod').text().split('vez el ').pop().trim().split(' a las ')

  addToContent('dateLastUpdated', moment.tz(dateInput[0] + ' ' + dateInput[1], 'DD MMM YYYY HH:mm', 'America/Caracas').format())
  addToContent('dateExtracted', new Date())
}
