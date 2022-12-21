import { LivechatRooms, Messages } from '@rocket.chat/models';
import type { IMessage } from '@rocket.chat/core-typings';

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

	getMessagesFromRoom({ rid }: { rid: string }): Promise<IMessage[]> {
		return Messages.findLivechatMessages(rid, {
			sort: { ts: 1 },
			projection: { _id: 1, msg: 1, u: 1, t: 1, ts: 1, attachments: 1 },
		}).toArray();
	}

	// You're the only one missing :troll:
	async requestTranscript({ details }: { details: any }): Promise<void> {
		const room = await LivechatRooms.findOneById(details.rid);
		if (!room) {
			throw new Error('room-not-found');
		}

		if (room.open) {
			throw new Error('room-still-open');
		}

		if (!room.servedBy || !room.v) {
			throw new Error('improper-room-state');
		}

		// Don't request a transcript if there's already one requested :)
		if (room.pdfTranscriptRequested) {
			// TODO: use logger
			console.log('Transcript already requested for this room');
			return;
		}

		await LivechatRooms.setTranscriptRequestedPdfById(details.rid);

		// On here, we're doing something "interesting". We're fetching all messages and putting them in the queue to be processed
		// This may not be ideal, since a message list could be huge. We could instead just pass the room ID and have the worker
		// fetch the messages itself. This would be a bit more efficient, but would require the worker to be "contaminated" with
		// this extra logic, and having 2 purposes.
		// This way provides one advantage, that is: whenever the worker is ready to process the job, it will have all the data it needs
		// to do so. This is a bit more "pure" in the sense that the worker is just a worker, and doesn't have to know about the
		// business logic of the app, apart from fetching buffers for files.
		// As a note: queue perf won't be affected, as the size of the object will only affect in transit, not in the queue itself.
		// The only drawback would be memory usage on the queue and network usage, but that's a tradeoff we can make.
		// Otherwise, we can just pass the room ID and have the worker fetch the messages itself.
		await this.queueService.queueWork('work', 'pdf-worker.renderToStream', {
			template: 'omnichannel-transcript',
			details: { userId: details.userId, rid: details.rid, from: this.name },
			data: { messages: await this.getMessagesFromRoom({ rid: details.rid }), visitor: room.v, agent: room.servedBy },
		});
	}

	async pdfFailed({ details }: any): Promise<void> {
		// Remove `transcriptRequestedPdf` from room
		const room = await LivechatRooms.findOneById(details.rid);
		if (!room) {
			return;
		}

		await LivechatRooms.unsetTranscriptRequestedPdfById(details.rid);

		const { rid } = await this.messageService.createDirectMessage({ to: details.userId, from: 'rocket.cat' });
		await this.messageService.sendMessage({ fromId: 'rocket.cat', rid, msg: 'PDF Generation failed :(' });
	}

	async pdfComplete({ details, file }: any): Promise<void> {
		// Send the file to the livechat room where this was requested, to keep it in context
		try {
			await LivechatRooms.setPdfTranscriptFileIdById(details.rid, file._id);
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
