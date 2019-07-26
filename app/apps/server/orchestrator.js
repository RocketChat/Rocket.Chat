import { Meteor } from 'meteor/meteor';
import { TAPi18n } from 'meteor/tap:i18n';
import { AppManager } from '@rocket.chat/apps-engine/server/AppManager';

import { RealAppBridges } from './bridges';
import { AppMethods, AppsRestApi, AppServerNotifier } from './communication';
import { AppMessagesConverter, AppRoomsConverter, AppSettingsConverter, AppUsersConverter } from './converters';
import { AppRealStorage, AppRealLogsStorage } from './storage';
import { settings } from '../../settings';
import { Permissions, AppsLogsModel, AppsModel, AppsPersistenceModel, Roles, Users } from '../../models';
import { Logger } from '../../logger';

export let Apps;

class AppServerOrchestrator {
	constructor() {
		this._rocketchatLogger = new Logger('Rocket.Chat Apps');
		Permissions.createOrUpdate('manage-apps', ['admin']);

		this._marketplaceUrl = 'https://marketplace.rocket.chat';

		this._model = new AppsModel();
		this._logModel = new AppsLogsModel();
		this._persistModel = new AppsPersistenceModel();
		this._storage = new AppRealStorage(this._model);
		this._logStorage = new AppRealLogsStorage(this._logModel);

		this._converters = new Map();
		this._converters.set('messages', new AppMessagesConverter(this));
		this._converters.set('rooms', new AppRoomsConverter(this));
		this._converters.set('settings', new AppSettingsConverter(this));
		this._converters.set('users', new AppUsersConverter(this));

		this._bridges = new RealAppBridges(this);

		this._manager = new AppManager(this._storage, this._logStorage, this._bridges);

		this._communicators = new Map();
		this._communicators.set('methods', new AppMethods(this));
		this._communicators.set('notifier', new AppServerNotifier(this));
		this._communicators.set('restapi', new AppsRestApi(this, this._manager));
	}

	getModel() {
		return this._model;
	}

	getPersistenceModel() {
		return this._persistModel;
	}

	getStorage() {
		return this._storage;
	}

	getLogStorage() {
		return this._logStorage;
	}

	getConverters() {
		return this._converters;
	}

	getBridges() {
		return this._bridges;
	}

	getNotifier() {
		return this._communicators.get('notifier');
	}

	getManager() {
		return this._manager;
	}

	isEnabled() {
		return settings.get('Apps_Framework_enabled');
	}

	isLoaded() {
		return this.getManager().areAppsLoaded();
	}

	isDebugging() {
		return settings.get('Apps_Framework_Development_Mode');
	}

	getRocketChatLogger() {
		return this._rocketchatLogger;
	}

	debugLog(...args) {
		if (this.isDebugging()) {
			// eslint-disable-next-line
			console.log(...args);
		}
	}

	getMarketplaceUrl() {
		return this._marketplaceUrl;
	}

	load() {
		// Don't try to load it again if it has
		// already been loaded
		if (this.isLoaded()) {
			return Promise.resolve();
		}

		return this._manager.load()
			.then((affs) => console.log(`Loaded the Apps Framework and loaded a total of ${ affs.length } Apps!`))
			.catch((err) => console.warn('Failed to load the Apps Framework and Apps!', err));
	}

	unload() {
		// Don't try to unload it if it's already been
		// unlaoded or wasn't unloaded to start with
		if (!this.isLoaded()) {
			return Promise.resolve();
		}

		return this._manager.unload()
			.then(() => console.log('Unloaded the Apps Framework.'))
			.catch((err) => console.warn('Failed to unload the Apps Framework!', err));
	}

	updateAppsMarketplaceInfo(apps = []) {
		if (!this.isLoaded()) {
			return Promise.resolve();
		}

		return this._manager.updateAppsMarketplaceInfo(apps)
			.then((apps) => {
				this.notifyAdminsAboutInvalidAppsIfNecessary(apps);
				return apps;
			});
	}

	notifyAdminsAboutInvalidAppsIfNecessary(apps) {
		const invalidApps = apps.filter((app) => app.getLatestLicenseValidationResult().hasErrors());

		if (invalidApps.length === 0) {
			return;
		}

		const id = 'someAppInInvalidState';
		const title = 'Warning';
		const text = 'There is one or more apps in an invalid state. Click here to review.';
		const link = '/admin/apps';

		Roles.findUsersInRole('admin').forEach((adminUser) => {
			Users.removeBannerById(id);

			try {
				Meteor.runAsUser(adminUser._id, () => Meteor.call('createDirectMessage', 'rocket.cat'));

				Meteor.runAsUser('rocket.cat', () => Meteor.call('sendMessage', {
					msg: `*${ TAPi18n.__(title, adminUser.language) }*\n${ TAPi18n.__(text, adminUser.language) }\n${ link }`,
					rid: [adminUser._id, 'rocket.cat'].sort().join(''),
				}));
			} catch (e) {
				console.error(e);
			}

			Users.addBannerById(adminUser._id, {
				id,
				priority: 10,
				title,
				text,
				modifiers: ['danger'],
				link,
			});
		});
	}
}

settings.addGroup('General', function() {
	this.section('Apps', function() {
		this.add('Apps_Framework_enabled', true, {
			type: 'boolean',
			hidden: false,
		});

		this.add('Apps_Framework_Development_Mode', false, {
			type: 'boolean',
			enableQuery: {
				_id: 'Apps_Framework_enabled',
				value: true,
			},
			public: true,
			hidden: false,
		});
	});
});

settings.get('Apps_Framework_enabled', (key, isEnabled) => {
	// In case this gets called before `Meteor.startup`
	if (!Apps) {
		return;
	}

	if (isEnabled) {
		Apps.load();
	} else {
		Apps.unload();
	}
});

Meteor.startup(function _appServerOrchestrator() {
	Apps = new AppServerOrchestrator();

	if (Apps.isEnabled()) {
		Apps.load();
	}
});
