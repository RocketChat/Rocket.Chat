import { i18n } from '../../../app/utils/lib/i18n';
import { Utilities } from '../../lib/misc/Utilities';
import { AppEvents } from './communication';
import { Apps } from './orchestrator';

const loadAppI18nResources = (appId, languages) => {
	Object.entries(languages).forEach(([language, translations]) => {
		try {
			// Translations keys must be scoped under app id
			const scopedTranslations = Object.entries(translations).reduce((translations, [key, value]) => {
				translations[Utilities.getI18nKeyForApp(key, appId)] = value;
				return translations;
			}, {});

			i18n.addResourceBundle(language, 'core', scopedTranslations);
		} catch (error) {
			Apps.handleError(error);
		}
	});
};

const handleAppAdded = async (appId) => {
	const languages = await Apps.getAppLanguages(appId);
	loadAppI18nResources(appId, languages);
};

export const handleI18nResources = async () => {
	const apps = await Apps.getAppsLanguages();
	apps.forEach(({ id, languages }) => {
		loadAppI18nResources(id, languages);
	});

	Apps.getWsListener().unregisterListener(AppEvents.APP_ADDED, handleAppAdded);
	Apps.getWsListener().registerListener(AppEvents.APP_ADDED, handleAppAdded);
};
