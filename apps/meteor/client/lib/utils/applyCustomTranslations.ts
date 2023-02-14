import { TAPi18n, TAPi18next } from 'meteor/rocketchat:tap-i18n';

import { settings } from '../../../app/settings/client';

export const applyCustomTranslations = (): void => {
	const customTranslations: string | undefined = settings.get('Custom_Translations');

	if (!customTranslations) {
		return;
	}

	try {
		const parsedCustomTranslations: Record<string, unknown> = JSON.parse(customTranslations);

		for (const [lang, translations] of Object.entries(parsedCustomTranslations)) {
			TAPi18next.addResourceBundle(lang, 'project', translations);
		}
		TAPi18n._language_changed_tracker.changed();
	} catch (e) {
		console.error('Invalid setting Custom_Translations', e);
	}
};
