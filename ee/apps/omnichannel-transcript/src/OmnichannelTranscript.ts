import { LivechatRooms } from '@rocket.chat/models';

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
	async requestTranscript({ details }: { details: any }): Promise<void> {
		// @ts-expect-error - wait for implementation
		await LivechatRooms.setTranscriptRequestedPdfById(details.rid);
		// On here we should check if the room has already a PDF transcript requested, and return true if that's the case
		// Temporary while we implement the actual logic :)
		await this.queueService.queueWork('work', 'pdf-worker.renderToStream', {
			template: 'omnichannel-transcript',
			details: { userId: 'rocketchat.internal.admin.test', rid: 'GENERAL', from: this.name },
			data: { some: 'data' },
		});
	}

	async pdfFailed({ details }: any): Promise<void> {
		// Remove `transcriptRequestedPdf` from room
		const room = await LivechatRooms.findOneById(details.rid);
		if (!room) {
			return;
		}

		// @ts-expect-error - wait for implementation
		await LivechatRooms.unsetTranscriptRequestedPdfById(details.rid);

		const { rid } = await this.messageService.createDirectMessage({ to: details.userId, from: 'rocket.cat' });
		await this.messageService.sendMessage({ fromId: 'rocket.cat', rid, msg: 'Your PDF has failed to generate!' });
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
