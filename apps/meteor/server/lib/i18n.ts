import i18nDict from '@rocket.chat/i18n';

import { availableTranslationNamespaces, defaultTranslationNamespace, extractTranslationNamespaces, i18n } from '../../app/utils/lib/i18n';

void i18n.init({
	lng: 'en',
	fallbackLng: 'en',
	defaultNS: defaultTranslationNamespace,
	ns: availableTranslationNamespaces,
	nsSeparator: '.',
	resources: Object.fromEntries(
		Object.entries(i18nDict).map(([language, source]) => [
			language,
			extractTranslationNamespaces(source as unknown as Record<string, string>),
		]),
	),
	initImmediate: false,
});

export { i18n };
