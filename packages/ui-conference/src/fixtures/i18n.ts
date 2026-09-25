import en from '@rocket.chat/i18n/dist/resources/en.i18n.json';
import i18next from 'i18next';
import { initReactI18next } from 'react-i18next';

/**
 * The real English copy, as an i18next instance for stories to render against.
 *
 * Without it a story shows key names: `mockAppRoot` builds its own i18next instance with *no resources* and
 * wraps its children in an `I18nextProvider`, so anything calling `useTranslation()` gets each key handed
 * straight back — `__count__people_joined` where "2 people joined" belongs.
 *
 * `keySeparator` and `nsSeparator` are off so the dotted keys in the file are treated as the flat names they
 * are, rather than as paths to hang objects off strings that are already there.
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
	initAsync: false,
});
