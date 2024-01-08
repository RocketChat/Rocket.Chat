import { settings } from '../../../app/settings/client';
import { i18n } from '../../../app/utils/lib/i18n';

const parseToJSON = (customTranslations: string) => {
	try {
		return JSON.parse(customTranslations);
	} catch (e) {
		return false;
	}
};

export const applyCustomTranslations = (): void => {
	const customTranslations: string | undefined = settings.get('Custom_Translations');

	if (!customTranslations || !parseToJSON(customTranslations)) {
		return;
	}

	try {
		const parsedCustomTranslations: Record<string, unknown> = JSON.parse(customTranslations);

		for (const [lang, translations] of Object.entries(parsedCustomTranslations)) {
			i18n.addResourceBundle(lang, 'core', translations);
		}
	} catch (e) {
		console.error('Invalid setting Custom_Translations', e);
	}
};
