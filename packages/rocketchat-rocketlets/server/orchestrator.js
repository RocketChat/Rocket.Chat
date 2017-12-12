import { RealRocketletBridges } from './bridges';
import { RocketletMethods, RocketletsRestApi, RocketletWebsocketNotifier } from './communication';
import { RocketletMessagesConverter, RocketletRoomsConverter, RocketletSettingsConverter, RocketletUsersConverter } from './converters';
import { RocketletsModel, RocketletsPersistenceModel, RocketletRealStorage } from './storage';

import { RocketletManager } from 'temporary-rocketlets-server/server/RocketletManager';

class RocketletServerOrchestrator {
	constructor() {
		if (RocketChat.models && RocketChat.models.Permissions) {
			RocketChat.models.Permissions.createOrUpdate('manage-rocketlets', ['admin']);
		}

		this._model = new RocketletsModel();
		this._persistModel = new RocketletsPersistenceModel();
		this._storage = new RocketletRealStorage(this._model);

		this._converters = new Map();
		this._converters.set('messages', new RocketletMessagesConverter(this));
		this._converters.set('rooms', new RocketletRoomsConverter(this));
		this._converters.set('settings', new RocketletSettingsConverter(this));
		this._converters.set('users', new RocketletUsersConverter(this));

		this._bridges = new RealRocketletBridges(this);

		this._manager = new RocketletManager(this._storage, this._bridges);

		this._communicators = new Map();
		this._communicators.set('methods', new RocketletMethods(this._manager));
		this._communicators.set('notifier', new RocketletWebsocketNotifier());
		this._communicators.set('restapi', new RocketletsRestApi(this._manager));
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

Meteor.startup(function _rocketletServerOrchestrator() {
	// Ensure that everything is setup
	if (process.env.NODE_ENV !== 'development' && (process.env[RocketletManager.ENV_VAR_NAME_FOR_ENABLING] !== 'true' && process.env[RocketletManager.SUPER_FUN_ENV_ENABLEMENT_NAME] !== 'true')) {
		return new RocketletMethods();
	}

	console.log('Orchestrating the rocketlet piece...');
	global.Rocketlets = new RocketletServerOrchestrator();

	global.Rocketlets.getManager().load()
		.then(() => console.log('...done! ;)'))
		.catch((err) => console.warn('...failed!', err));
});
