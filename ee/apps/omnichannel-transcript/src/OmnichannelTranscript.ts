import { ServiceClass } from '../../../../apps/meteor/server/sdk/types/ServiceClass';
import type { IOmnichannelTranscriptService } from '../../../../apps/meteor/server/sdk/types/IOmnichannelTranscriptService';
import type { Upload, Message, QueueWorker } from '../../../../apps/meteor/server/sdk';

export class OmnichannelTranscript extends ServiceClass implements IOmnichannelTranscriptService {
	protected name = 'omnichannel-transcript';

	constructor(
		private readonly uploadService: typeof Upload,
		private readonly messageService: typeof Message,
		private readonly queueService: typeof QueueWorker,
	) {
		super();

		// your stuff
	}

	getConfig(): unknown {
		return null;
	}

	// You're the only one missing :troll:
	async requestTranscript(): Promise<void> {
		// Temporary while we implement the actual logic :)
		await this.queueService.queueWork('work', 'pdf-worker.renderToStream', {
			template: 'omnichannel-transcript',
			details: { userId: 'rocketchat.internal.admin.test', rid: 'GENERAL', from: this.name },
			data: { some: 'data' },
		});
	}

	async pdfComplete({ details, file }: any): Promise<void> {
		// Send the file to the livechat room where this was requested, to keep it in context
		try {
			await this.uploadService.sendFileMessage({
				roomId: details.rid,
				userId: 'rocket.cat',
				file,
				// @ts-expect-error - why?
				message: {
					// Translate from service
					msg: 'Your PDF has been generated!',
				},
			});

			// Send the file to the user who requested it, so they can download it
			const { rid } = await this.messageService.createDirectMessage({ to: details.userId, from: 'rocket.cat' });
			await this.uploadService.sendFileMessage({
				roomId: rid,
				userId: 'rocket.cat',
				file,
				// @ts-expect-error - why?
				message: {
					// Translate from service
					msg: 'Your PDF has been generated!',
				},
			});
		} catch (e) {
			console.error('Error sending transcript as message', e);
		}
	}
}
