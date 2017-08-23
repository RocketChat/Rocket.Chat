export class RocketletWebsocketNotifier {
	constructor() {
		this.streamer = new Meteor.Streamer('rocketlets', { retransmit: false });
		this.streamer.allowRead('all');
		this.streamer.allowEmit('all');
		this.streamer.allowWrite('none');
	}

	rocketletAdded(rocketletId) {
		this.streamer.emit('rocketlet/added', rocketletId);
	}

	rockletRemoved(rocketletId) {
		this.streamer.emit('rocketlet/removed', rocketletId);
	}

	rockletUpdated(rocketletId) {
		this.streamer.emit('rocketlet/updated', rocketletId);
	}

	commandAdded(command) {
		this.streamer.emit('command/added', command);
	}

	commandDisabled(command) {
		this.streamer.emit('command/disabled', command);
	}

	commandUpdated(command) {
		this.streamer.emit('command/updated', command);
	}
}
