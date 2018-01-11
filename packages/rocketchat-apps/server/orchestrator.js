import { RealAppBridges } from './bridges';
import { AppMethods, AppsRestApi, AppWebsocketNotifier } from './communication';
import { AppMessagesConverter, AppRoomsConverter, AppSettingsConverter, AppUsersConverter } from './converters';
import { AppsLogsModel, AppsModel, AppsPersistenceModel, AppRealStorage, AppRealLogsStorage } from './storage';

import { AppManager } from '@rocket.chat/apps-engine/server/AppManager';

class AppServerOrchestrator {
	constructor() {
		if (RocketChat.models && RocketChat.models.Permissions) {
			RocketChat.models.Permissions.createOrUpdate('manage-apps', ['admin']);
		}

		this._model = new AppsModel();
		this._logModel = new AppsLogsModel();
		this._persistModel = new AppsPersistenceModel();
		this._storage = new AppRealStorage(this._model);
		this._logStorage = new AppRealLogsStorage(this._persistModel);

		this._converters = new Map();
		this._converters.set('messages', new AppMessagesConverter(this));
		this._converters.set('rooms', new AppRoomsConverter(this));
		this._converters.set('settings', new AppSettingsConverter(this));
		this._converters.set('users', new AppUsersConverter(this));

		this._bridges = new RealAppBridges(this);

		this._manager = new AppManager(this._storage, this._logStorage, this._bridges);

		this._communicators = new Map();
		this._communicators.set('methods', new AppMethods(this._manager));
		this._communicators.set('notifier', new AppWebsocketNotifier());
		this._communicators.set('restapi', new AppsRestApi(this._manager));
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
}

Meteor.startup(function _appServerOrchestrator() {
	// Ensure that everything is setup
	if (process.env.NODE_ENV !== 'development' && (process.env[AppManager.ENV_VAR_NAME_FOR_ENABLING] !== 'true' && process.env[AppManager.SUPER_FUN_ENV_ENABLEMENT_NAME] !== 'true')) {
		return new AppMethods();
	}

	console.log('Orchestrating the app piece...');
	global.Apps = new AppServerOrchestrator();

	global.Apps.getManager().load()
		.then(() => console.log('...done! ;)'))
		.catch((err) => console.warn('...failed!', err));
});
