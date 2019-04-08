import { TAPi18n, TAPi18next } from 'meteor/tap:i18n';
import { settings } from '../../../settings';

export function applyCustomTranslations() {
	let CustomTranslations = settings.get('Custom_Translations');
	if (typeof CustomTranslations === 'string' && CustomTranslations.trim() !== '') {
		try {
			CustomTranslations = JSON.parse(CustomTranslations);

			for (const lang in CustomTranslations) {
				if (CustomTranslations.hasOwnProperty(lang)) {
					const translations = CustomTranslations[lang];
					TAPi18next.addResourceBundle(lang, 'project', translations);
				}
			}
			TAPi18n._language_changed_tracker.changed();
		} catch (e) {
			console.error('Invalid setting Custom_Translations', e);
		}
	}
}
