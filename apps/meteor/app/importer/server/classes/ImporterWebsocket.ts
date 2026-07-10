import type { IImportProgress } from '@rocket.chat/core-typings';

import notifications from '../../../../server/lib/notifications/core/lib/Notifications';
import type { IStreamer } from '../../../../server/modules/streamer/types';

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
