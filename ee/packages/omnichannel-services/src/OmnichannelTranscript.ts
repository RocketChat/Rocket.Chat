import type { Readable } from 'stream';

import {
	ServiceClass,
	Upload as uploadService,
	Message as messageService,
	Room as roomService,
	QueueWorker as queueService,
	Translation as translationService,
	Settings as settingsService,
	License as licenseService,
} from '@rocket.chat/core-services';
import type { IOmnichannelTranscriptService } from '@rocket.chat/core-services';
import type { IMessage, IUser, IRoom, IUpload, ILivechatVisitor, ILivechatAgent } from '@rocket.chat/core-typings';
import { isQuoteAttachment, isFileAttachment, isFileImageAttachment } from '@rocket.chat/core-typings';
import type { Logger } from '@rocket.chat/logger';
import { parse } from '@rocket.chat/message-parser';
import type { Root } from '@rocket.chat/message-parser';
import { LivechatRooms, Messages, Uploads, Users, LivechatVisitors } from '@rocket.chat/models';
import { PdfWorker } from '@rocket.chat/pdf-worker';
import { guessTimezone, guessTimezoneFromOffset, streamToBuffer } from '@rocket.chat/tools';

const isPromiseRejectedResult = (result: any): result is PromiseRejectedResult => result.status === 'rejected';

type WorkDetails = {
	rid: IRoom['_id'];
	userId: IUser['_id'];
};

type WorkDetailsWithSource = WorkDetails & {
	from: string;
};

type Quote = { name: string; ts?: Date; md: Root };

type MessageData = Pick<IMessage, '_id' | 'ts' | 'u' | 'msg' | 'md'> & {
	files: ({ name?: string; buffer: Buffer | null; extension?: string } | undefined)[];
	quotes: (Quote | undefined)[];
};

type WorkerData = {
	siteName: string;
	visitor: ILivechatVisitor | null;
	agent: ILivechatAgent | undefined;
	closedAt?: Date;
	messages: MessageData[];
	timezone: string;
	dateFormat: string;
	timeAndDateFormat: string;
	translations: { key: string; value: string }[];
};

export class OmnichannelTranscript extends ServiceClass implements IOmnichannelTranscriptService {
	protected name = 'omnichannel-transcript';

	private worker: PdfWorker;

	private log: Logger;

	maxNumberOfConcurrentJobs = 25;

	currentJobNumber = 0;

	shouldWork = false;

	constructor(loggerClass: typeof Logger) {
		super();
		this.worker = new PdfWorker('chat-transcript');
		// eslint-disable-next-line new-cap
		this.log = new loggerClass('OmnichannelTranscript');

		this.onEvent('license.module', ({ module, valid }) => {
			if (module === 'scalability') {
				this.shouldWork = valid;
			}
		});
	}

	async started(): Promise<void> {
		try {
			this.shouldWork = await licenseService.hasLicense('scalability');
		} catch (e: unknown) {
			// ignore
		}
	}

	async getTimezone(user?: { utcOffset?: string | number }): Promise<string> {
		const reportingTimezone = await settingsService.get('Default_Timezone_For_Reporting');

		switch (reportingTimezone) {
			case 'custom':
				return settingsService.get<string>('Default_Custom_Timezone');
			case 'user':
				if (user?.utcOffset) {
					return guessTimezoneFromOffset(user.utcOffset);
				}
				return guessTimezone();
			default:
				return guessTimezone();
		}
	}

	private getMessagesFromRoom({ rid }: { rid: string }): Promise<IMessage[]> {
		// Closing message should not appear :)
		return Messages.findLivechatMessagesWithoutClosing(rid, {
			sort: { ts: 1 },
			projection: { _id: 1, msg: 1, u: 1, t: 1, ts: 1, attachments: 1, files: 1, md: 1 },
		}).toArray();
	}

	async requestTranscript({ details }: { details: WorkDetails }): Promise<void> {
		if (!this.shouldWork) {
			this.log.info(`Not requesting transcript for room ${details.rid} because scalability module is not enabled`);
			return;
		}
		this.log.info(`Requesting transcript for room ${details.rid} by user ${details.userId}`);
		const room = await LivechatRooms.findOneById(details.rid);
		if (!room) {
			throw new Error('room-not-found');
		}

		if (room.open) {
			throw new Error('room-still-open');
		}

		if (!room.v) {
			throw new Error('improper-room-state');
		}

		// Don't request a transcript if there's already one requested :)
		if (room.pdfTranscriptRequested) {
			// TODO: use logger
			this.log.info(`Transcript already requested for room ${details.rid}`);
			return;
		}

		await LivechatRooms.setTranscriptRequestedPdfById(details.rid);

		// Make the whole process sync when running on test mode
		// This will prevent the usage of timeouts on the tests of this functionality :)
		if (process.env.TEST_MODE) {
			await this.workOnPdf({ details: { ...details, from: this.name } });
			return;
		}

		// Even when processing is done "in-house", we still need to queue the work
		// to avoid blocking the request
		this.log.info(`Queuing work for room ${details.rid}`);
		await queueService.queueWork('work', `${this.name}.workOnPdf`, {
			details: { ...details, from: this.name },
		});
	}

	private getQuotesFromMessage(message: IMessage): Quote[] {
		const quotes: Quote[] = [];

		if (!message.attachments) {
			return quotes;
		}

		for (const attachment of message.attachments) {
			if (isQuoteAttachment(attachment)) {
				const { text, author_name: name, md, ts } = attachment;

				if (text) {
					quotes.push({
						name,
						md: md ?? parse(text),
						ts,
					});
				}

				quotes.push(...this.getQuotesFromMessage({ attachments: attachment.attachments } as IMessage));
			}
		}

		return quotes;
	}

	private async getMessagesData(userId: string, messages: IMessage[]): Promise<MessageData[]> {
		const messagesData: MessageData[] = [];
		for await (const message of messages) {
			if (!message.attachments?.length) {
				// If there's no attachment and no message, what was sent? lol
				messagesData.push({
					_id: message._id,
					files: [],
					quotes: [],
					ts: message.ts,
					u: message.u,
					msg: message.msg,
					md: message.md,
				});
				continue;
			}
			const files = [];
			const quotes = [];

			for await (const attachment of message.attachments) {
				if (isQuoteAttachment(attachment)) {
					quotes.push(...this.getQuotesFromMessage(message));
					continue;
				}

				if (!isFileAttachment(attachment)) {
					this.log.error(`Invalid attachment type ${(attachment as any).type} for file ${attachment.title} in room ${message.rid}!`);
					// ignore other types of attachments
					continue;
				}
				if (!isFileImageAttachment(attachment)) {
					this.log.error(`Invalid attachment type ${attachment.type} for file ${attachment.title} in room ${message.rid}!`);
					// ignore other types of attachments
					files.push({ name: attachment.title, buffer: null });
					continue;
				}

				if (!this.worker.isMimeTypeValid(attachment.image_type)) {
					this.log.error(`Invalid mime type ${attachment.image_type} for file ${attachment.title} in room ${message.rid}!`);
					// ignore invalid mime types
					files.push({ name: attachment.title, buffer: null });
					continue;
				}
				let file = message.files?.map((v) => ({ _id: v._id, name: v.name })).find((file) => file.name === attachment.title);
				if (!file) {
					this.log.debug(`File ${attachment.title} not found in room ${message.rid}!`);
					// For some reason, when an image is uploaded from clipboard, it doesn't have a file :(
					// So, we'll try to get the FILE_ID from the `title_link` prop which has the format `/file-upload/FILE_ID/FILE_NAME` using a regex
					const fileId = attachment.title_link?.match(/\/file-upload\/(.*)\/.*/)?.[1];
					if (!fileId) {
						this.log.error(`File ${attachment.title} not found in room ${message.rid}!`);
						// ignore attachments without file
						files.push({ name: attachment.title, buffer: null });
						continue;
					}
					file = { _id: fileId, name: attachment.title || 'upload' };
				}

				if (!file) {
					this.log.error(`File ${attachment.title} not found in room ${message.rid}!`);
					// ignore attachments without file
					files.push({ name: attachment.title, buffer: null });
					continue;
				}

				const uploadedFile = await Uploads.findOneById(file._id);
				if (!uploadedFile) {
					this.log.error(`Uploaded file ${file._id} not found in room ${message.rid}!`);
					// ignore attachments without file
					files.push({ name: file.name, buffer: null });
					continue;
				}

				const fileBuffer = await uploadService.getFileBuffer({ userId, file: uploadedFile });
				files.push({ name: file.name, buffer: fileBuffer, extension: uploadedFile.extension });
			}

			// When you send a file message, the things you type in the modal are not "msg", they're in "description" of the attachment
			// So, we'll fetch the the msg, if empty, go for the first description on an attachment, if empty, empty string
			const msg = message.msg || message.attachments.find((attachment) => attachment.description)?.description || '';
			// Remove nulls from final array
			messagesData.push({
				_id: message._id,
				msg,
				u: message.u,
				files: files.filter(Boolean),
				quotes,
				ts: message.ts,
				md: message.md,
			});
		}

		return messagesData;
	}

	private async getTranslations(): Promise<Array<{ key: string; value: string }>> {
		const keys: string[] = ['Agent', 'Date', 'Customer', 'Not_assigned', 'Time', 'Chat_transcript', 'This_attachment_is_not_supported'];

		return Promise.all(
			keys.map(async (key) => {
				return {
					key,
					value: await translationService.translateToServerLanguage(key),
				};
			}),
		);
	}

	async workOnPdf({ details }: { details: WorkDetailsWithSource }): Promise<void> {
		if (!this.shouldWork) {
			this.log.info(`Processing transcript for room ${details.rid} by user ${details.userId} - Stopped (no scalability license found)`);
			return;
		}
		this.log.info(`Processing transcript for room ${details.rid} by user ${details.userId} - Received from queue`);
		if (this.maxNumberOfConcurrentJobs <= this.currentJobNumber) {
			this.log.error(`Processing transcript for room ${details.rid} by user ${details.userId} - Too many concurrent jobs, queuing again`);
			throw new Error('retry');
		}
		this.currentJobNumber++;
		try {
			const room = await LivechatRooms.findOneById(details.rid);
			if (!room) {
				throw new Error('room-not-found');
			}
			const messages = await this.getMessagesFromRoom({ rid: room._id });

			const visitor =
				room.v && (await LivechatVisitors.findOneById(room.v._id, { projection: { _id: 1, name: 1, username: 1, visitorEmails: 1 } }));
			const agent =
				room.servedBy && (await Users.findOneAgentById(room.servedBy._id, { projection: { _id: 1, name: 1, username: 1, utcOffset: 1 } }));

			const messagesData = await this.getMessagesData(details.userId, messages);

			const [siteName, dateFormat, timeAndDateFormat, timezone, translations] = await Promise.all([
				settingsService.get<string>('Site_Name'),
				settingsService.get<string>('Message_DateFormat'),
				settingsService.get<string>('Message_TimeAndDateFormat'),
				this.getTimezone(agent),
				this.getTranslations(),
			]);
			const data = {
				visitor,
				agent,
				closedAt: room.closedAt,
				siteName,
				messages: messagesData,
				dateFormat,
				timeAndDateFormat,
				timezone,
				translations,
			};

			await this.doRender({ data, details });
		} catch (error) {
			await this.pdfFailed({ details, e: error as Error });
		} finally {
			this.currentJobNumber--;
		}
	}

	async doRender({ data, details }: { data: WorkerData; details: WorkDetailsWithSource }): Promise<void> {
		const transcriptText = await translationService.translateToServerLanguage('Transcript');

		const stream = await this.worker.renderToStream({ data });
		const outBuff = await streamToBuffer(stream as Readable);

		try {
			const file = await uploadService.uploadFile({
				userId: details.userId,
				buffer: outBuff,
				details: {
					// transcript_{company-name)_{date}_{hour}.pdf
					name: `${transcriptText}_${data.siteName}_${new Intl.DateTimeFormat('en-US').format(new Date())}_${
						data.visitor?.name || data.visitor?.username || 'Visitor'
					}.pdf`,
					type: 'application/pdf',
					rid: details.rid,
					// Rocket.cat is the goat
					userId: 'rocket.cat',
					size: outBuff.length,
				},
			});
			await this.pdfComplete({ details, file });
		} catch (e: any) {
			this.pdfFailed({ details, e });
		}
	}

	private async pdfFailed({ details, e }: { details: WorkDetailsWithSource; e: Error }): Promise<void> {
		this.log.error(`Transcript for room ${details.rid} by user ${details.userId} - Failed: ${e.message}`);
		const room = await LivechatRooms.findOneById(details.rid);
		if (!room) {
			return;
		}
		const user = await Users.findOneById(details.userId);
		if (!user) {
			return;
		}

		// Remove `transcriptRequestedPdf` from room to allow another request
		await LivechatRooms.unsetTranscriptRequestedPdfById(details.rid);

		const { rid } = await roomService.createDirectMessage({ to: details.userId, from: 'rocket.cat' });
		this.log.info(`Transcript for room ${details.rid} by user ${details.userId} - Sending error message to user`);
		await messageService.sendMessage({
			fromId: 'rocket.cat',
			rid,
			msg: `${await translationService.translate('pdf_error_message', user)}: ${e.message}`,
		});
	}

	private async pdfComplete({ details, file }: { details: WorkDetailsWithSource; file: IUpload }): Promise<void> {
		this.log.info(`Transcript for room ${details.rid} by user ${details.userId} - Complete`);
		const user = await Users.findOneById(details.userId);
		if (!user) {
			return;
		}
		// Send the file to the livechat room where this was requested, to keep it in context
		try {
			const [, { rid }] = await Promise.all([
				LivechatRooms.setPdfTranscriptFileIdById(details.rid, file._id),
				roomService.createDirectMessage({ to: details.userId, from: 'rocket.cat' }),
			]);

			this.log.info(`Transcript for room ${details.rid} by user ${details.userId} - Sending success message to user`);
			const result = await Promise.allSettled([
				uploadService.sendFileMessage({
					roomId: details.rid,
					userId: 'rocket.cat',
					file,
					message: {
						// Translate from service
						msg: await translationService.translateToServerLanguage('pdf_success_message'),
					},
				}),
				// Send the file to the user who requested it, so they can download it
				uploadService.sendFileMessage({
					roomId: rid,
					userId: 'rocket.cat',
					file,
					message: {
						// Translate from service
						msg: await translationService.translate('pdf_success_message', user),
					},
				}),
			]);
			const e = result.find((r) => isPromiseRejectedResult(r));
			if (e && isPromiseRejectedResult(e)) {
				throw e.reason;
			}
		} catch (err) {
			this.log.error({ msg: `Transcript for room ${details.rid} by user ${details.userId} - Failed to send message`, err });
		}
	}
}
