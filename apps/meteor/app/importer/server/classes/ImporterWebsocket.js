import notifications from '../../../notifications/server/lib/Notifications';

class ImporterWebsocketDef {
	constructor() {
		this.streamer = notifications.streamImporters;
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
