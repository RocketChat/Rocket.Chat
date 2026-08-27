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
 * Given as a whole instance rather than through `mockAppRoot().withTranslations(…)` for two reasons. The builder
 * loads resources key by key, and with a dot for both the key and namespace separator a flat key like
 * `onboarding.component.form.action.next` is read as a *path* — loading it tries to hang `component` off the
 * string already at `onboarding`, which throws. And an instance can simply be provided closer to the story than
 * the builder's own, which is what makes it win: see `RocketChatDecorator (and `withCallProviders`, for stories that build their own app root)`.
 *
 * `keySeparator` and `nsSeparator` are off precisely so those 179 dotted keys are treated as the flat names they
 * are, which is why all 7471 of them load here.
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
