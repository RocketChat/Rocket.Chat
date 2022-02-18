import { AppClientManager } from '@rocket.chat/apps-engine/client/AppClientManager';
import { Meteor } from 'meteor/meteor';
import { Tracker } from 'meteor/tracker';

import { dispatchToastMessage } from '../../../client/lib/toast';
import { hasAtLeastOnePermission } from '../../authorization';
import { settings } from '../../settings/client';
import { CachedCollectionManager } from '../../ui-cached-collection';
import { APIClient } from '../../utils';
import { AppWebsocketReceiver } from './communication';
import { handleI18nResources } from './i18n';
import { RealAppsEngineUIHost } from './RealAppsEngineUIHost';

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
		this._appClientUIHost = new RealAppsEngineUIHost();
		this._manager = new AppClientManager(this._appClientUIHost);
		this.isLoaded = false;
		[this.deferredIsEnabled, this.setEnabled] = createDeferredValue();
	}

	load = async (isEnabled) => {
		if (!this.isLoaded) {
			this.ws = new AppWebsocketReceiver();
			this.isLoaded = true;
		}

		this.setEnabled(isEnabled);

		// Since the deferred value (a promise) is immutable after resolved,
		// it need to be recreated to resolve a new value
		[this.deferredIsEnabled, this.setEnabled] = createDeferredValue();

		await handleI18nResources();
		this.setEnabled(isEnabled);
	};

	getWsListener = () => this.ws;

	getAppClientManager = () => this._manager;

	handleError = (error) => {
		console.error(error);
		if (hasAtLeastOnePermission(['manage-apps'])) {
			dispatchToastMessage({
				type: 'error',
				message: error.message,
			});
		}
	};

	isEnabled = () => this.deferredIsEnabled;

	getApps = async () => {
		const { apps } = await APIClient.get('apps');
		return apps;
	};

	getAppsFromMarketplace = async () => {
		const appsOverviews = await APIClient.get('apps', { marketplace: 'true' });
		return appsOverviews.map(({ latest, price, pricingPlans, purchaseType, isEnterpriseOnly, modifiedAt }) => ({
			...latest,
			price,
			pricingPlans,
			purchaseType,
			isEnterpriseOnly,
			modifiedAt,
		}));
	};

	getAppsOnBundle = async (bundleId) => {
		const { apps } = await APIClient.get(`apps/bundles/${bundleId}/apps`);
		return apps;
	};

	getAppsLanguages = async () => {
		const { apps } = await APIClient.get('apps/languages');
		return apps;
	};

	getApp = async (appId) => {
		const { app } = await APIClient.get(`apps/${appId}`);
		return app;
	};

	getAppFromMarketplace = async (appId, version) => {
		const { app } = await APIClient.get(`apps/${appId}`, {
			marketplace: 'true',
			version,
		});
		return app;
	};

	getLatestAppFromMarketplace = async (appId, version) => {
		const { app } = await APIClient.get(`apps/${appId}`, {
			marketplace: 'true',
			update: 'true',
			appVersion: version,
		});
		return app;
	};

	getAppSettings = async (appId) => {
		const { settings } = await APIClient.get(`apps/${appId}/settings`);
		return settings;
	};

	setAppSettings = async (appId, settings) => {
		const { updated } = await APIClient.post(`apps/${appId}/settings`, undefined, { settings });
		return updated;
	};

	getAppApis = async (appId) => {
		const { apis } = await APIClient.get(`apps/${appId}/apis`);
		return apis;
	};

	getAppLanguages = async (appId) => {
		const { languages } = await APIClient.get(`apps/${appId}/languages`);
		return languages;
	};

	installApp = async (appId, version, permissionsGranted) => {
		const { app } = await APIClient.post('apps/', {
			appId,
			marketplace: true,
			version,
			permissionsGranted,
		});
		return app;
	};

	updateApp = async (appId, version, permissionsGranted) => {
		const { app } = await APIClient.post(`apps/${appId}`, {
			appId,
			marketplace: true,
			version,
			permissionsGranted,
		});
		return app;
	};

	uninstallApp = (appId) => APIClient.delete(`apps/${appId}`);

	syncApp = (appId) => APIClient.post(`apps/${appId}/sync`);

	setAppStatus = async (appId, status) => {
		const { status: effectiveStatus } = await APIClient.post(`apps/${appId}/status`, { status });
		return effectiveStatus;
	};

	enableApp = (appId) => this.setAppStatus(appId, 'manually_enabled');

	disableApp = (appId) => this.setAppStatus(appId, 'manually_disabled');

	buildExternalUrl = (appId, purchaseType = 'buy', details = false) =>
		APIClient.get('apps', {
			buildExternalUrl: 'true',
			appId,
			purchaseType,
			details,
		});

	getCategories = async () => {
		const categories = await APIClient.get('apps', { categories: 'true' });
		return categories;
	};

	getUIHost = () => this._appClientUIHost;
}

export const Apps = new AppClientOrchestrator();

Meteor.startup(() => {
	CachedCollectionManager.onLogin(() => {
		Meteor.call('apps/is-enabled', (error, isEnabled) => {
			if (error) {
				Apps.handleError(error);
				return;
			}

			Apps.getAppClientManager().initialize();
			Apps.load(isEnabled);
		});
	});

	Tracker.autorun(() => {
		const isEnabled = settings.get('Apps_Framework_enabled');
		Apps.load(isEnabled);
	});
});
