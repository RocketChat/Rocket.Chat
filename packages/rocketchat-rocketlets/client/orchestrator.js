import { RocketletWebsocketReceiver } from './communication';

class RocketletClientOrchestrator {
	constructor() {
		this.ws = new RocketletWebsocketReceiver(this);
	}

	getWsListener() {
		return this.ws;
	}
}

Meteor.startup(function _rlClientOrch() {
	window.Rocketlets = new RocketletClientOrchestrator();
});
