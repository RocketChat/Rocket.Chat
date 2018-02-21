export class AppWebsocketListener {
	constructor(orch, streamer) {
		this.orch = orch;
		this.streamer = streamer;

		this.streamer.on('app/added', this.onAppAdded.bind(this));
		this.streamer.on('app/statusUpdate', this.onAppStatusUpdated.bind(this));
		this.streamer.on('app/removed', this.onAppRemoved.bind(this));
		console.log('hello from the app websocket listener');
	}

	onAppAdded(appId) {
		console.log('On App Added!', appId);
		this.orch.getManager().loadOne(appId).then(() => console.log('yay'));
	}

	onAppStatusUpdated({ appId, status }) {
		console.log('App Status Update:', appId, status);
	}

	onAppRemoved(appId) {
		console.log('On App Removed!', appId);
	}
}

export class AppWebsocketNotifier {
	constructor(orch) {
		this.streamer = new Meteor.Streamer('apps', { retransmit: true, retransmitToSelf: true });
		this.streamer.allowRead('all');
		this.streamer.allowEmit('all');
		this.streamer.allowWrite('none');

		this.listener = new AppWebsocketListener(orch, this.streamer);
	}

	appAdded(appId) {
		this.streamer.emit('app/added', appId);
		console.log('emitting: "app/added"', appId);
	}

	appRemoved(appId) {
		this.streamer.emit('app/removed', appId);
	}

	appUpdated(appId) {
		this.streamer.emit('app/updated', appId);
	}

	appStatusUpdated(appId, status) {
		this.streamer.emit('app/statusUpdate', { appId, status });
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
