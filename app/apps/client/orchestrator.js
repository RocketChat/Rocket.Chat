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

	load = (isEnabled) => {
		if (!this.isLoaded) {
			this.ws = new AppWebsocketReceiver(this);
			this.registerAdminMenuItems();
			this.isLoaded = true;
		}

		this.setEnabled(isEnabled);

		// Since the deferred value (a promise) is immutable after resolved,
		// it need to be recreated to resolve a new value
		[this.deferredIsEnabled, this.setEnabled] = createDeferredValue();

		Meteor.defer(async () => {
			await this._loadLanguages();
			this.setEnabled(isEnabled);
		});
	}

	getWsListener = () => this.ws

	// TODO: move this method to somewhere else
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

	async _loadLanguages() {
		const apps = await this.getAppsLanguages();
		apps.forEach(({ id, languages }) => this.parseAndLoadLanguages(languages, id));
	}

	parseAndLoadLanguages(languages, id) {
		Object.entries(languages).forEach(([language, translations]) => {
			try {
				translations = Object.entries(translations).reduce((newTranslations, [key, value]) => {
					newTranslations[Utilities.getI18nKeyForApp(key, id)] = value;
					return newTranslations;
				}, {});

				TAPi18next.addResourceBundle(language, 'project', translations);
			} catch (e) {
				// Failed to parse the json
			}
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
				console.error(error);
				toastr.error(error.message);
				return;
			}

			Apps.load(isEnabled);
		});
	});
});
