import { RocketletRestApiClient, RocketletWebsocketReceiver } from './communication';

class RocketletClientOrchestrator {
	constructor() {
		this.ws = new RocketletWebsocketReceiver(this);
		this.rest = new RocketletRestApiClient(this);
	}

	getWsListener() {
		return this.ws;
	}

	getRestApiClient() {
		return this.rest;
	}
}

Meteor.startup(function _rlClientOrch() {
	window.Rocketlets = new RocketletClientOrchestrator();
});
