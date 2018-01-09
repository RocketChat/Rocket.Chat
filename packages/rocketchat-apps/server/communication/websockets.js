export class AppWebsocketNotifier {
	constructor() {
		this.streamer = new Meteor.Streamer('apps', { retransmit: false });
		this.streamer.allowRead('all');
		this.streamer.allowEmit('all');
		this.streamer.allowWrite('none');
	}

	appAdded(appId) {
		this.streamer.emit('app/added', appId);
	}

	rockletRemoved(appId) {
		this.streamer.emit('app/removed', appId);
	}

	rockletUpdated(appId) {
		this.streamer.emit('app/updated', appId);
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

	commandRemoved(command) {
		this.streamer.emit('command/removed', command);
	}
}
