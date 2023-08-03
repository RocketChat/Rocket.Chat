import type { IImportProgress } from '@rocket.chat/core-typings';
import type { IStreamer } from 'meteor/rocketchat:streamer';

import notifications from '../../../notifications/server/lib/Notifications';

class ImporterWebsocketDef {
	private streamer: IStreamer<'importers'>;

	constructor() {
		this.streamer = notifications.streamImporters;
	}

	/**
	 * Called when the progress is updated.
	 *
	 * @param {Progress} progress The progress of the import.
	 */
	progressUpdated(progress: { rate: number } | IImportProgress) {
		this.streamer.emit('progress', progress);
	}
}

export const ImporterWebsocket = new ImporterWebsocketDef();
