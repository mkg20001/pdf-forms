'use strict'

/* eslint-disable camelcase */

const Forms = require('..')
const eq = require('assert').strict.deepEqual

describe('forms', () => {
  let pdf
  let out

  describe('V0050', () => {
    before(async () => {
      pdf = Forms.load(require.resolve('./V0050.pdf'))
    })

    it('should get all fields', async () => {
      const fields = await pdf.getFields()
      eq(fields.Q_PAF_Vers_Vorname.alternativeText, 'Vorname (Rufname)')
      eq(fields.Q_PAF_Vers_Name.alternativeText, 'Name')
    })

    it('should fill in fields', async () => {
      out = await pdf.fillOut({
        Q_PAF_Vers_Vorname: 'Max',
        Q_PAF_Vers_Name: 'Musterman',
        AW_UEBERBRÜCK_1: true,
      })
    })

    it('should successfully read them again', async () => {
      const fields = await Forms.load(out).getFields()

      eq(fields.Q_PAF_Vers_Vorname.fieldValue, 'Max')
      eq(fields.Q_PAF_Vers_Name.fieldValue, 'Musterman')
      eq(fields.AW_UEBERBRÜCK_1.fieldValue, 'ja')
    })
  })
})
