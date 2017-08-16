export class RocketletWebsocketNotifier {
	constructor() {
		this.streamer = new Meteor.Streamer('rocketlets', { retransmit: false });
		this.streamer.allowRead('all');
		this.streamer.allowEmit('all');
		this.streamer.allowWrite('none');
	}

	commandAdded(command) {
		this.streamer.emit('command/added', command);
	}

	commandDisabled(command) {
		this.streamer.emit('command/disabled', command);
	}
}
