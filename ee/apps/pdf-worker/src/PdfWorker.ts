import { ServiceClass } from '../../../../apps/meteor/server/sdk/types/ServiceClass';
import type { IPDFWorkerService } from '../../../../apps/meteor/server/sdk/types/IPDFWorkerService';
import type { Upload, QueueWorker } from '../../../../apps/meteor/server/sdk';
import exportTranscript from './templates/transcriptTemplate';

export class PdfWorker extends ServiceClass implements IPDFWorkerService {
	protected name = 'pdf-worker';

	constructor(private readonly uploadService: typeof Upload, private readonly queueService: typeof QueueWorker) {
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

	// You're the only one missing :troll:
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
			console.log(details);
			// Ideally, here we would upload the file using the uploads service
			// Then run the notifyCompletion so the service that requested the file
			// can be notified that the file is ready and notify whenever it sees fit
			// This way, this service doesn't handle notifications and its not coupled to it

			// File will be uploaded once stream is finished
			// And service will be notified once file is uploaded
			// So requesting service receives an actual Uploaded file and can send notifications with it
			return this.uploadService
				.uploadFile({
					userId: details.userId,
					buffer: outBuff,
					details: {
						name: 'transcript.pdf',
						type: 'application/pdf',
						rid: details.rid,
						// Let's use rocket.cat as the user
						userId: 'rocket.cat',
						size: outBuff.length,
					},
				})
				.then((file) => {
					return this.notifyCompletion(details.from, details, file);
				})
				.then(() => console.log('Succesfuly notified file completion'))
				.catch((err) => this.notifyFailure(details.from, details, err));
		});
	}

	// When Job fails, we return the error to the queue
	private async notifyFailure(from: string, details: any, error: any): Promise<void> {
		console.log('notifyFailure', from, error);
		await this.queueService.queueWork(`workComplete`, `${from}.pdfFailed`, { error, details });
	}

	// When Job is completed, we return the file info to the queue
	// So it can notify the right service that process finished
	// And service can do whatever it needs to do with the file (notifications, etc)
	private async notifyCompletion(from: string, details: any, file: any): Promise<void> {
		console.log('notifyCompletion', from, file);
		await this.queueService.queueWork(`workComplete`, `${from}.pdfComplete`, { file, details });
	}
}
