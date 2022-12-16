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
		// Do something with the file
		console.log('pdfComplete', data);
	}
}
