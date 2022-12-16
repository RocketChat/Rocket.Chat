import { ServiceClass } from '../../../../apps/meteor/server/sdk/types/ServiceClass';
import type { IPDFWorkerService } from '../../../../apps/meteor/server/sdk/types/IPDFWorkerService';
import { QueueWorker } from '../../../../apps/meteor/server/sdk';
import exportTranscript from './templates/transcriptTemplate';

export class PdfWorker extends ServiceClass implements IPDFWorkerService {
	protected name = 'pdf-worker';

	constructor() {
		super();

		// your stuff
	}

	private renderTemplate(template: string, data: any): Promise<NodeJS.ReadableStream> {
		switch (template) {
			case 'omnichannel-transcript':
				return exportTranscript(data);
			default:
				throw new Error('Template not found');
		}
	}

	// more stuff
	getConfig(): unknown {
		console.log('why this shit works?');
		return null;
	}

	async renderToStream({ details, template, data }: { details: any; template: string; data: any }): Promise<void> {
		// On here, there should be a parsing step where we collect images from the message list
		// Attachment should came with an ID so we can get the file buffer from the file service
		// Then we use that in the render step to avoid any complications
		// Apart from messages, `data` should contain the header info, so data should be something like:
		// { header: { ... }, body: [ ... ], footer: { ... } }
		// That way, it's responsibility of the template to know how to render the data and not responsibility of the worker
		const stream = await this.renderTemplate(template, data);
		const buf: Uint8Array[] = [];
		let outBuff = Buffer.alloc(0);

		stream.on('data', (chunk) => {
			buf.push(chunk);
		});
		stream.on('end', () => {
			outBuff = Buffer.concat(buf);
			// Ideally, here we would upload the file using the uploads service
			// Then run the notifyCompletion so the service that requested the file
			// can be notified that the file is ready and notify whenever it sees fit
			// This way, this service doesnt handle notifications and its not coupled to it

			// This service is not yet defined, but will work like this
			// @ts-exxpect-error - service not yet defined
			// const file = await UploadService.uploadFile({ buffer: outBuff, details });

			return this.notifyCompletion(details.from, outBuff);
		});
	}

	// When Job is completed, we return the file info to the queue
	// So it can notify the right service that process finished
	// And service can do whatever it needs to do with the file (notifications, etc)
	private async notifyCompletion(from: string, file: any): Promise<void> {
		await QueueWorker.queueWork(`workComplete`, `${from}.pdfComplete`, { file });
	}
}
