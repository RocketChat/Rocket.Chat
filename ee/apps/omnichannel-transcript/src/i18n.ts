import { availableTranslationNamespaces, defaultTranslationNamespace, extractTranslationNamespaces } from '@rocket.chat/i18n';
import languages from '@rocket.chat/i18n/dist/languages';
import i18next from 'i18next';
import sprintf from 'i18next-sprintf-postprocessor';

const i18n = i18next.use(sprintf);

void i18n.init({
	lng: 'en',
	fallbackLng: 'en',
	defaultNS: defaultTranslationNamespace,
	ns: availableTranslationNamespaces,
	nsSeparator: '.',
	resources: Object.fromEntries(
		languages.map((language) => [
			language,
			extractTranslationNamespaces(
				// TODO: commonjs is terrible but we don't have esm build yet
				// eslint-disable-next-line @typescript-eslint/no-var-requires, import/no-dynamic-require
				require(`@rocket.chat/i18n/dist/resources/${language}.i18n.json`) as unknown as Record<string, string>,
			),
		]),
	),
	initImmediate: false,
});

export { i18n };
