import { i18n } from '../../../app/utils/lib/i18n';

export const applyCustomTranslations = (parsedCustomTranslations: Record<string, unknown>): void => {
	for (const [lang, translations] of Object.entries(parsedCustomTranslations)) {
		i18n.addResourceBundle(lang, 'core', translations);
	}
};
