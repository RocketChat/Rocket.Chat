import { Meteor } from 'meteor/meteor';
import { AppManager } from '@rocket.chat/apps-engine/server/AppManager';

import { Logger } from '../../logger';
import { AppsLogsModel, AppsModel, AppsPersistenceModel, Permissions } from '../../models';
import { settings } from '../../settings';
import { RealAppBridges } from './bridges';
import { AppMethods, AppServerNotifier, AppsRestApi, AppUIKitInteractionApi } from './communication';
import { AppMessagesConverter, AppRoomsConverter, AppSettingsConverter, AppUsersConverter } from './converters';
import { AppDepartmentsConverter } from './converters/departments';
import { AppUploadsConverter } from './converters/uploads';
import { AppVisitorsConverter } from './converters/visitors';
import { AppRealLogsStorage, AppRealStorage } from './storage';

function isTesting() {
	return process.env.TEST_MODE === 'true';
}


class AppServerOrchestrator {
	constructor() {
		this._isInitialized = false;
	}

	initialize() {
		this._rocketchatLogger = new Logger('Rocket.Chat Apps');
		Permissions.create('manage-apps', ['admin']);

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
		this._converters.set('visitors', new AppVisitorsConverter(this));
		this._converters.set('departments', new AppDepartmentsConverter(this));
		this._converters.set('uploads', new AppUploadsConverter(this));

		this._bridges = new RealAppBridges(this);

		this._manager = new AppManager(this._storage, this._logStorage, this._bridges);

		this._communicators = new Map();
		this._communicators.set('methods', new AppMethods(this));
		this._communicators.set('notifier', new AppServerNotifier(this));
		this._communicators.set('restapi', new AppsRestApi(this, this._manager));
		this._communicators.set('uikit', new AppUIKitInteractionApi(this));

		this._isInitialized = true;
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

	getProvidedComponents() {
		return this._manager.getExternalComponentManager().getProvidedComponents();
	}

	isInitialized() {
		return this._isInitialized;
	}

	isEnabled() {
		return settings.get('Apps_Framework_enabled');
	}

	isLoaded() {
		return this.getManager().areAppsLoaded();
	}

	isDebugging() {
		return settings.get('Apps_Framework_Development_Mode') && !isTesting();
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

	async load() {
		// Don't try to load it again if it has
		// already been loaded
		if (this.isLoaded()) {
			return;
		}

		return this._manager.load()
			.then((affs) => console.log(`Loaded the Apps Framework and loaded a total of ${ affs.length } Apps!`))
			.catch((err) => console.warn('Failed to load the Apps Framework and Apps!', err));
	}

	async unload() {
		// Don't try to unload it if it's already been
		// unlaoded or wasn't unloaded to start with
		if (!this.isLoaded()) {
			return;
		}

		return this._manager.unload()
			.then(() => console.log('Unloaded the Apps Framework.'))
			.catch((err) => console.warn('Failed to unload the Apps Framework!', err));
	}

	async updateAppsMarketplaceInfo(apps = []) {
		if (!this.isLoaded()) {
			return;
		}

		return this._manager.updateAppsMarketplaceInfo(apps)
			.then(() => this._manager.get());
	}
}

export const Apps = new AppServerOrchestrator();

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

		this.add('Apps_Game_Center_enabled', false, {
			type: 'boolean',
			enableQuery: {
				_id: 'Apps_Framework_enabled',
				value: true,
			},
			hidden: false,
			public: true,
			alert: 'Experimental_Feature_Alert',
		});
	});
});


settings.get('Apps_Framework_enabled', (key, isEnabled) => {
	// In case this gets called before `Meteor.startup`
	if (!Apps.isInitialized()) {
		return;
	}

	if (isEnabled) {
		Apps.load();
	} else {
		Apps.unload();
	}
});

Meteor.startup(function _appServerOrchestrator() {
	Apps.initialize();

	if (Apps.isEnabled()) {
		Apps.load();
	}
});
