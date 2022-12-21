import { LivechatRooms, Messages, Uploads } from '@rocket.chat/models';
import { PdfWorker } from '@rocket.chat/pdf-worker2';
import type { IMessage } from '@rocket.chat/core-typings';

import { ServiceClass } from '../../../../apps/meteor/server/sdk/types/ServiceClass';
import type { IOmnichannelTranscriptService } from '../../../../apps/meteor/server/sdk/types/IOmnichannelTranscriptService';
import type { Upload, Message, QueueWorker } from '../../../../apps/meteor/server/sdk';

const isPromiseRejectedResult = (result: any): result is PromiseRejectedResult => result.status === 'rejected';

export class OmnichannelTranscript extends ServiceClass implements IOmnichannelTranscriptService {
	protected name = 'omnichannel-transcript';

	private worker: PdfWorker;

	constructor(
		private readonly uploadService: typeof Upload,
		private readonly messageService: typeof Message,
		private readonly queueService: typeof QueueWorker,
	) {
		super();
		this.worker = new PdfWorker();
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

		// Even when processing is done "in-house", we still need to queue the work
		// to avoid blocking the request
		await this.queueService.queueWork('work', `${this.name}.workOnPdf`, {
			template: 'omnichannel-transcript',
			details: { userId: details.userId, rid: details.rid, from: this.name },
		});
	}

	private async getFiles(
		userId: string,
		messages: IMessage[],
	): Promise<(Pick<IMessage, '_id' | 'ts' | 'u' | 'msg'> & { files: ({ name?: string; buffer: Buffer | null } | undefined)[] })[]> {
		return Promise.all(
			messages.map(async (message: IMessage) => {
				if (!message.attachments || !message.attachments.length) {
					return { _id: message._id, files: [], ts: message.ts, u: message.u, msg: message.msg };
				}

				const files = await Promise.all(
					message.attachments.map(async (attachment) => {
						// @ts-expect-error - messages...
						if (attachment.type !== 'file') {
							// ignore other types of attachments
							return;
						}
						// @ts-expect-error - messages...
						if (!this.worker.isMimeTypeValid(attachment.image_type)) {
							// ignore invalid mime types
							return { name: attachment.title, buffer: null };
						}
						const file = message.files?.find((file) => file.name === attachment.title);
						if (!file) {
							// ignore attachments without file
							// This shouldn't happen, but just in case :)
							return;
						}
						const uploadedFile = await Uploads.findOneById(file._id);
						if (!uploadedFile) {
							// ignore attachments without file
							return { name: file.name, buffer: null };
						}

						const fileBuffer = await this.uploadService.getFileBuffer({ userId, file: uploadedFile });
						return { name: file.name, buffer: fileBuffer };
					}),
				);

				return { _id: message._id, msg: message.msg, u: message.u, files, ts: message.ts };
			}),
		);
	}

	async workOnPdf({ template, details }: { template: string; details: any }): Promise<void> {
		console.log('workOnPdf', details);
		const room = await LivechatRooms.findOneById(details.rid);
		if (!room) {
			throw new Error('room-not-found');
		}
		const messages = await this.getMessagesFromRoom({ rid: room._id });

		const data = {
			visitor: room.v,
			agent: room.servedBy,
			messages: await this.getFiles(details.userId, messages),
		};

		try {
			console.log('doRender', { template, data, details });
			await this.doRender({ template, data, details });
		} catch (error) {
			console.error(error);
			await this.pdfFailed({ details, e: error });
		}
	}

	async doRender({ template, data, details }: { template: string; data: any; details: any }): Promise<void> {
		const buf: Uint8Array[] = [];
		let outBuff = Buffer.alloc(0);

		const stream = await this.worker.renderToStream({ template, data, details });
		stream.on('data', (chunk) => {
			buf.push(chunk);
		});
		stream.on('end', () => {
			outBuff = Buffer.concat(buf);

			return this.uploadService
				.uploadFile({
					userId: details.userId,
					buffer: outBuff,
					details: {
						name: 'transcript.pdf',
						type: 'application/pdf',
						rid: details.rid,
						// Rocket.cat is the goat
						userId: 'rocket.cat',
						size: outBuff.length,
					},
				})
				.then((file) => this.pdfComplete({ details, file }))
				.catch((e) => this.pdfFailed({ details, e }));
		});
	}

	async pdfFailed({ details, e }: { details: any; e: any }): Promise<void> {
		console.error('pdfFailed', e);
		// Remove `transcriptRequestedPdf` from room
		const room = await LivechatRooms.findOneById(details.rid);
		if (!room) {
			return;
		}

		await LivechatRooms.unsetTranscriptRequestedPdfById(details.rid);

		const { rid } = await this.messageService.createDirectMessage({ to: details.userId, from: 'rocket.cat' });
		await this.messageService.sendMessage({ fromId: 'rocket.cat', rid, msg: `PDF Failed :( => ${e.message}` });
	}

	async pdfComplete({ details, file }: any): Promise<void> {
		// Send the file to the livechat room where this was requested, to keep it in context
		try {
			const [, { rid }] = await Promise.all([
				LivechatRooms.setPdfTranscriptFileIdById(details.rid, file._id),
				this.messageService.createDirectMessage({ to: details.userId, from: 'rocket.cat' }),
			]);

			const result = await Promise.allSettled([
				this.uploadService.sendFileMessage({
					roomId: details.rid,
					userId: 'rocket.cat',
					file,
					// @ts-expect-error - why?
					message: {
						// Translate from service
						msg: 'Your PDF has been generated!',
					},
				}),
				// Send the file to the user who requested it, so they can download it
				this.uploadService.sendFileMessage({
					roomId: rid,
					userId: 'rocket.cat',
					file,
					// @ts-expect-error - why?
					message: {
						// Translate from service
						msg: 'Your PDF has been generated!',
					},
				}),
			]);
			const e = result.find((r) => isPromiseRejectedResult(r));
			if (e && isPromiseRejectedResult(e)) {
				throw e.reason;
			}
		} catch (e) {
			console.error('Error sending transcript as message', e);
		}
	}
}
