import { Meteor } from 'meteor/meteor';
import { TAPi18next } from 'meteor/tap:i18n';
import toastr from 'toastr';

import { AppWebsocketReceiver } from './communication';
import { Utilities } from '../lib/misc/Utilities';
import { APIClient } from '../../utils';
import { AdminBox } from '../../ui-utils';
import { CachedCollectionManager } from '../../ui-cached-collection';
import { hasAtLeastOnePermission } from '../../authorization';

const createDeferredValue = () => {
	let resolve;
	let reject;
	const promise = new Promise((_resolve, _reject) => {
		resolve = _resolve;
		reject = _reject;
	});

	return [promise, resolve, reject];
};

class AppClientOrchestrator {
	constructor() {
		this.isLoaded = false;
		[this.deferredIsEnabled, this.setEnabled] = createDeferredValue();
	}

	load = async (isEnabled) => {
		if (!this.isLoaded) {
			this.ws = new AppWebsocketReceiver(this);
			this.registerAdminMenuItems();
			this.isLoaded = true;
		}

		this.setEnabled(isEnabled);

		// Since the deferred value (a promise) is immutable after resolved,
		// it need to be recreated to resolve a new value
		[this.deferredIsEnabled, this.setEnabled] = createDeferredValue();

		await this.loadLanguagesResourceBundles();
		this.setEnabled(isEnabled);
	}

	getWsListener = () => this.ws

	registerAdminMenuItems = () => {
		AdminBox.addOption({
			icon: 'cube',
			href: 'apps',
			i18nLabel: 'Apps',
			permissionGranted: () => hasAtLeastOnePermission(['manage-apps']),
		});

		AdminBox.addOption({
			icon: 'cube',
			href: 'marketplace',
			i18nLabel: 'Marketplace',
			permissionGranted: () => hasAtLeastOnePermission(['manage-apps']),
		});
	}

	handleError = (error) => {
		console.error(error);
		if (hasAtLeastOnePermission(['manage-apps'])) {
			toastr.error(error.message);
		}
	}

	loadLanguagesResourceBundles = async () => {
		const apps = await this.getAppsLanguages();
		apps.forEach(({ id, languages }) => {
			Object.entries(languages).forEach(([language, translations]) => {
				try {
					// Translations keys must be scoped under app id
					const scopedTranslations = Object.entries(translations)
						.reduce((translations, [key, value]) => {
							translations[Utilities.getI18nKeyForApp(key, id)] = value;
							return translations;
						}, {});

					TAPi18next.addResourceBundle(language, 'project', scopedTranslations);
				} catch (error) {
					this.handleError(error);
				}
			});
		});
	}

	isEnabled = () => this.deferredIsEnabled

	getApps = async () => {
		const { apps } = await APIClient.get('apps');
		return apps;
	}

	getAppApis = async (appId) => {
		const { apis } = await APIClient.get(`apps/${ appId }/apis`);
		return apis;
	}

	getCategories = async () => {
		const categories = await APIClient.get('apps?categories=true');
		return categories;
	}

	getAppsLanguages = async () => {
		const { apps } = await APIClient.get('apps/languages');
		return apps;
	}
}

export const Apps = new AppClientOrchestrator();

Meteor.startup(() => {
	CachedCollectionManager.onLogin(() => {
		Meteor.call('apps/is-enabled', (error, isEnabled) => {
			if (error) {
				Apps.handleError(error);
				return;
			}

			Apps.load(isEnabled);
		});
	});
});
