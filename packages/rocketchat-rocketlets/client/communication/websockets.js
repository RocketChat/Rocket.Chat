export class RocketletWebsocketReceiver {
	constructor(restApi) {
		this.rest = restApi;
		this.streamer = new Meteor.Streamer('rocketlets');

		this.streamer.on('command/added', this.onCommandAdded);
	}

	onCommandAdded(command) {
		console.log('Added:', command);
	}
}
