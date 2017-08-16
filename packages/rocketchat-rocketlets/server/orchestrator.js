import { RocketletCommandsBridge } from './bridges';
import { RocketletWebsocketNotifier } from './communication';
import { RocketletMessagesConverter, RocketletRoomsConverter } from './converters';
import { RocketletsModel } from './models/Rocketlets';

class RocketletServerOrchestrator {
	constructor() {
		this._model = new RocketletsModel();

		this._converters = new Map();
		this._converters.set('messages', new RocketletMessagesConverter(this._converters));
		this._converters.set('rooms', new RocketletRoomsConverter(this._converters));

		this._bridges = new Map();
		this._bridges.set('commands', new RocketletCommandsBridge(this._converters));

		this._communicators = new Map();
		this._communicators.set('notifier', new RocketletWebsocketNotifier());
	}

	getModel() {
		return this._model;
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
}

Meteor.startup(function _rocketletServerOrchestrator() {
	console.log('Orchestrating the rocketlet piece...');
	Rocketlets = new RocketletServerOrchestrator();
	console.log('...done! :)');
});
