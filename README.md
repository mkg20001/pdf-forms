# pdf-forms

Easily fill out form fields in PDF files

# API

- `.load(fileOrBuffer)`: returns a PDF object

- PDF
  - `.getFields()`: Returns an object where the key is the field id and the value is the field description
  - `.fillOut(values)`: Takes an object, values, where the key is the field id and the value is the field value
    - Returns a buffer with a filled out PDF

# Usage

```js
const Forms = require('pdf-forms')

const yourTaxes = Forms.load('./tax-form.pdf')

const fields = await yourTaxes.getFields()

const fillIn = {}
for (const key in fields) { // fill everything with a 0
  fillIn[key] = '0'
}

const filledOut = await yourTaxes.fillOut(fillIn)

fs.writeFileSync('./filled-out.pdf', filledOut)
```
