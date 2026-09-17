import en from '@rocket.chat/i18n/dist/resources/en.i18n.json';
import i18next from 'i18next';
import { initReactI18next } from 'react-i18next';

/**
 * The real English copy, as an i18next instance for stories to render against.
 *
 * Without it a story shows key names: `mockAppRoot` builds its own i18next instance with *no resources* and
 * wraps its children in an `I18nextProvider`, so anything calling `useTranslation()` from react-i18next gets
 * each key handed straight back — `__count__people_joined` where "2 people joined" belongs. This is the same
 * locale file, and the same import path, the app itself loads (see `client/providers/TranslationProvider.tsx`).
 *
 */
export const storybookI18n = i18next.createInstance();

void storybookI18n.use(initReactI18next).init({
	lng: 'en',
	fallbackLng: 'en',
	ns: ['core'],
	defaultNS: 'core',
	resources: { en: { core: en } },
	keySeparator: false,
	nsSeparator: false,
	interpolation: { escapeValue: false },
	initImmediate: false,
});
