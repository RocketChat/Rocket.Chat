class ImporterWebsocketDef {
	constructor() {
		this.streamer = new Meteor.Streamer('importers', { retransmit: false });
		this.streamer.allowRead('all');
		this.streamer.allowEmit('all');
		this.streamer.allowWrite('none');
	}

	/**
	 * Called when the progress is updated.
	 *
	 * @param {Progress} progress The progress of the import.
	 */
	progressUpdated(progress) {
		this.streamer.emit('progress', progress);
	}
}

export const ImporterWebsocket = new ImporterWebsocketDef();
