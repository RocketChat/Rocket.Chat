import { TAPi18next } from 'meteor/rocketchat:tap-i18n';

import { Apps } from './orchestrator';
import { Utilities } from '../lib/misc/Utilities';
import { AppEvents } from './communication';
import { TranslationLanguage } from '../../../client/contexts/TranslationContext';

export const loadAppI18nResources = (appId: string, languages: TranslationLanguage[]): void => {
	Object.entries(languages).forEach(([language, translations]) => {
		try {
			// Translations keys must be scoped under app id
			const scopedTranslations = Object.entries(translations).reduce((translations, [key, value]) => {
				translations[Utilities.getI18nKeyForApp(key, appId) as string] = value;
				return translations;
			}, {} as Record<string, string>);

			TAPi18next.addResourceBundle(language, 'project', scopedTranslations);
		} catch (error) {
			Apps.handleError(error);
		}
	});
};

const handleAppAdded = async (appId: string): Promise<void> => {
	const languages = (await Apps.getAppLanguages(appId)) as TranslationLanguage[];
	loadAppI18nResources(appId, languages);
};

export const handleI18nResources = async (): Promise<void> => {
	const apps = await Apps.getAppsLanguages();
	apps.forEach(({ id, languages }: { id: string; languages: TranslationLanguage[] }) => {
		loadAppI18nResources(id, languages);
	});

	Apps.getWsListener().unregisterListener(AppEvents.APP_ADDED, handleAppAdded);
	Apps.getWsListener().registerListener(AppEvents.APP_ADDED, handleAppAdded);
};
