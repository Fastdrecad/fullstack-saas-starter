import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import en from '@web/locales/en/common.json'

i18n.use(initReactI18next).init({
  resources: {
    en: { common: en },
  },
  lng: 'en',
  defaultNS: 'common',
  ns: ['common'],
  interpolation: {
    escapeValue: false,
  },
})

export { i18n }
