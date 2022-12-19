import { ServiceClass } from '../../../../apps/meteor/server/sdk/types/ServiceClass';
import type { IOmnichannelTranscriptService } from '../../../../apps/meteor/server/sdk/types/IOmnichannelTranscriptService';
import { QueueWorker } from '../../../../apps/meteor/server/sdk';

export class OmnichannelTranscript extends ServiceClass implements IOmnichannelTranscriptService {
	protected name = 'omnichannel-transcript';

	constructor() {
		super();

		// your stuff
	}

	getConfig(): unknown {
		return null;
	}

	async requestTranscript(): Promise<void> {
		// Temporary while we implement the actual logic :)
		await QueueWorker.queueWork('work', 'pdf-worker.renderToStream', {
			template: 'omnichannel-transcript',
			details: { userId: 'rocket.cat', rid: 'general', from: this.name },
			data: { some: 'data' },
		});
	}

	async pdfComplete(data: any): Promise<void> {
		// Details should be propagated from requestTranscript to here, so we can know where to send the file
		// And who to notify (userId requesting)
		// Do something with the file
		console.log('pdfComplete', data);
		// Uploads.sendFileMessage(data.userId, null: store, data.file, { msg: 'We need translation here?' })
		// Uploads.sendFileMessage(rocket.cat, null, data.file, 'We need translation here?') // Your PDF has been generated!
	}
}
