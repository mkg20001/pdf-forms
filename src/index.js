'use strict'

const fs = require('fs')

// shim
const streams = require('web-streams-polyfill/ponyfill')
global.ReadableStream = streams.ReadableStream

const PDFJS = require('pdfjs-dist')

/* function renderPage(pageData) {
  // check documents https://mozilla.github.io/pdf.js/
  // ret.text = ret.text ? ret.text : "";

  const renderOptions = {
    // replaces all occurrences of whitespace with standard spaces (0x20). The default value is `false`.
    normalizeWhitespace: false,
    // do not attempt to combine same line TextItem's. The default value is `false`.
    disableCombineTextItems: false,
  }

  return pageData.getTextContent(renderOptions)
  .then(function (textContent) {
    let lastY
    let text = ''
    // https://github.com/mozilla/pdf.js/issues/8963
    // https://github.com/mozilla/pdf.js/issues/2140
    // https://gist.github.com/hubgit/600ec0c224481e910d2a0f883a7b98e3
    // https://gist.github.com/hubgit/600ec0c224481e910d2a0f883a7b98e3
    for (const item of textContent.items) {
      if (lastY === item.transform[5] || !lastY) {
        text += item.str
      } else {
        text += '\n' + item.str
      }
      lastY = item.transform[5]
    }
    // let strings = textContent.items.map(item => item.str);
    // let text = strings.join("\n");
    // text = text.replace(/[ ]+/ig," ");
    // ret.text = `${ret.text} ${text} \n\n`;
    return text
  })
} */

// thx https://stackoverflow.com/a/12101012/3990041

function toArrayBuffer(buf) {
  var ab = new ArrayBuffer(buf.length)
  var view = new Uint8Array(ab)
  for (var i = 0; i < buf.length; ++i) {
    view[i] = buf[i]
  }
  return ab
}

function toBuffer(ab) {
  var buf = Buffer.alloc(ab.byteLength)
  var view = new Uint8Array(ab)
  for (var i = 0; i < buf.length; ++i) {
    buf[i] = view[i]
  }
  return buf
}

async function withPdf(pdf, fnc) {
  const doc = await (await PDFJS.getDocument(toArrayBuffer(pdf))).promise

  const out = await fnc(doc)

  doc.destroy()
  return out
}

async function annotationList(doc) {
  const out = {}

  for (let page = 1; page < doc.numPages + 1; page++) {
    const content = await doc.getPage(page)
    // console.log(await content.getOperatorList())
    const annotations = await content.getAnnotations()

    for (let i = 0; i < annotations.length; i++) {
      const annotation = annotations[i]

      out[annotation.fieldName] = annotation
    }
  }

  return out
}

function PDF(pdf) {
  return {
    async getFields() {
      return withPdf(pdf, async doc => {
        return annotationList(doc)
      })
    },
    async fillOut(values) {
      return withPdf(pdf, async doc => {
        const fillIn = {}

        const list = await annotationList(doc)

        for (const field in values) { // eslint-disable-line guard-for-in
          if (!list[field]) {
            throw new Error(`Field ${JSON.stringify(field)} is not in this PDF`)
          }

          // TODO: type validate / input validate

          fillIn[list[field].id] = values[field]
        }

        const annotationStorage = {
          getAll: () => fillIn,
          resetModified: () => {},
        }

        return toBuffer(await doc.saveDocument(annotationStorage))
      })
    },
  }
}

module.exports = {
  load(fileOrBuf) {
    if (typeof fileOrBuf === 'string') {
      fileOrBuf = fs.readFileSync(fileOrBuf)
    }

    return PDF(fileOrBuf)
  },
  PDFJS_VERSION: PDFJS.version,
}
