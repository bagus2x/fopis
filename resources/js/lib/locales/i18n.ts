import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import idCommon from '@/lib/locales/id/common';
import idWelcome from '@/lib/locales/id/welcome';
import enCommon from '@/lib/locales/en/common';
import enWelcome from '@/lib/locales/en/welcome';
import enAuth from '@/lib/locales/en/auth';
import idAuth from '@/lib/locales/id/auth';

const resources = {
    id: {
        common: idCommon,
        welcome: idWelcome,
        auth: idAuth,
    },
    en: {
        common: enCommon,
        welcome: enWelcome,
        auth: enAuth,
    },
};

i18n.use(initReactI18next).init({
    resources,
    fallbackLng: 'id', // Set Indonesian as default
    defaultNS: 'common',
    ns: ['common', 'welcome'],
    interpolation: {
        escapeValue: false,
    },
    detection: {
        order: ['localStorage', 'navigator'],
        caches: ['localStorage'],
    },
});

export default i18n;
