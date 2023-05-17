import { i18n } from '../../../app/utils/lib/i18n';
import { Utilities } from '../../lib/misc/Utilities';
import { AppEvents } from './communication';
import { AppClientOrchestratorInstance } from './orchestrator';

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
			AppClientOrchestratorInstance.handleError(error);
		}
	});
};

const handleAppAdded = async (appId) => {
	const languages = await AppClientOrchestratorInstance.getAppLanguages(appId);
	loadAppI18nResources(appId, languages);
};

export const handleI18nResources = async () => {
	const apps = await AppClientOrchestratorInstance.getAppsLanguages();
	apps.forEach(({ id, languages }) => {
		loadAppI18nResources(id, languages);
	});

	AppClientOrchestratorInstance.getWsListener().unregisterListener(AppEvents.APP_ADDED, handleAppAdded);
	AppClientOrchestratorInstance.getWsListener().registerListener(AppEvents.APP_ADDED, handleAppAdded);
};
