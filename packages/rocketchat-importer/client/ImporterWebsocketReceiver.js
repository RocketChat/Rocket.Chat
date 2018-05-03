class ImporterWebsocketReceiverDef {
	constructor() {
		this.streamer = new Meteor.Streamer('importers');

		this.callbacks = [];
		this.streamer.on('progress', this.progressUpdated.bind(this));
	}

	progressUpdated(progress) {
		this.callbacks.forEach((c) => c(progress));
	}

	registerCallback(callback) {
		if (typeof callback !== 'function') {
			throw new Error('Callback must be a function.');
		}

		this.callbacks.push(callback);
	}

	unregisterCallback(callback) {
		const i = this.callbacks.indexOf(callback);
		if (i >= 0) {
			this.callbacks.splice(i, 1);
		}
	}
}

export const ImporterWebsocketReceiver = new ImporterWebsocketReceiverDef();
