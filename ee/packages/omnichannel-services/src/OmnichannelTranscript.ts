import type { Readable } from 'stream';

import {
	ServiceClass,
	Upload as uploadService,
	Message as messageService,
	Room as roomService,
	Settings as settingsService,
} from '@rocket.chat/core-services';
import type { IOmnichannelTranscriptService } from '@rocket.chat/core-services';
import type { IMessage, IUpload, ILivechatAgent, AtLeast, IOmnichannelRoom, IUser, ILivechatVisitor } from '@rocket.chat/core-typings';
import { isQuoteAttachment, isFileAttachment, isFileImageAttachment } from '@rocket.chat/core-typings';
import type { Logger } from '@rocket.chat/logger';
import { parse } from '@rocket.chat/message-parser';
import { MessageTypes } from '@rocket.chat/message-types';
import { LivechatRooms, Messages, Uploads, Users, LivechatVisitors } from '@rocket.chat/models';
import { PdfWorker } from '@rocket.chat/pdf-worker';
import type { MessageData, Quote, WorkerData } from '@rocket.chat/pdf-worker';
import { guessTimezone, guessTimezoneFromOffset, streamToBuffer } from '@rocket.chat/tools';
import type { TFunction, i18n } from 'i18next';

import type { WorkDetailsWithSource } from './localTypes';
import { isPromiseRejectedResult } from './localTypes';

export class OmnichannelTranscript extends ServiceClass implements IOmnichannelTranscriptService {
	protected name = 'omnichannel-transcript';

	private worker: PdfWorker;

	private log: Logger;

	maxNumberOfConcurrentJobs = 25;

	currentJobNumber = 0;

	constructor(
		loggerConstructor: typeof Logger,
		// Instance of i18n. Should already be init'd and loaded with the translation files
		private readonly translator: i18n,
	) {
		super();
		this.worker = new PdfWorker('chat-transcript');
		// eslint-disable-next-line new-cap
		this.log = new loggerConstructor('OmnichannelTranscript');
	}

	async getTimezone(agent?: AtLeast<ILivechatAgent, 'utcOffset'> | null): Promise<string> {
		const reportingTimezone = await settingsService.get<'server' | 'custom' | 'user'>('Default_Timezone_For_Reporting');

		switch (reportingTimezone) {
			case 'custom':
				return settingsService.get<string>('Default_Custom_Timezone');
			case 'user':
				if (agent?.utcOffset) {
					return guessTimezoneFromOffset(agent.utcOffset);
				}
				return guessTimezone();
			default:
				return guessTimezone();
		}
	}

	private async getMessagesFromRoom({ rid }: { rid: string }): Promise<IMessage[]> {
		const showSystemMessages = await settingsService.get<boolean>('Livechat_transcript_show_system_messages');

		// Closing message should not appear :)
		return Messages.findLivechatMessagesWithoutTypes(rid, ['command'], showSystemMessages, {
			sort: { ts: 1 },
			projection: {
				_id: 1,
				msg: 1,
				u: 1,
				t: 1,
				ts: 1,
				attachments: 1,
				files: 1,
				md: 1,
				navigation: 1,
				requestData: 1,
				transferData: 1,
				webRtcCallEndTs: 1,
				comment: 1,
				priorityData: 1,
				slaData: 1,
				rid: 1,
			},
		}).toArray();
	}

	private getQuotesFromMessage(message: IMessage): Quote[] {
		const quotes: Quote[] = [];

		if (!message.attachments) {
			return quotes;
		}

		for (const attachment of message.attachments) {
			if (!isQuoteAttachment(attachment)) {
				continue;
			}

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

		return quotes;
	}

	private getSystemMessage(message: IMessage, t: TFunction): MessageData | undefined {
		if (!message.t) return undefined;

		const systemMessageDefinition = MessageTypes.getType(message);

		if (!systemMessageDefinition) return undefined;

		return {
			...message,
			msg: systemMessageDefinition.text(t, message),
		};
	}

	async getMessagesData(messages: IMessage[], t: TFunction): Promise<MessageData[]> {
		const messagesData: MessageData[] = [];
		for await (const message of messages) {
			const systemMessage = this.getSystemMessage(message, t);

			if (systemMessage) {
				messagesData.push({
					...systemMessage,
					files: systemMessage.files ?? [],
					quotes: systemMessage.quotes ?? [],
				});
				continue;
			}

			if (!message.attachments?.length) {
				// If there's no attachment and no message, what was sent? lol
				messagesData.push({
					...message,
					files: [],
					quotes: [],
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
					this.log.error(
						`Invalid attachment type ${(attachment as { type?: string }).type} for file ${attachment.title} in room ${message.rid}!`,
					);
					// ignore other types of attachments
					continue;
				}
				if (!isFileImageAttachment(attachment)) {
					this.log.error(`Invalid attachment type ${attachment.type} for file ${attachment.title} in room ${message.rid}!`);
					// ignore other types of attachments
					files.push({ name: attachment.title });
					continue;
				}

				if (!this.worker.isMimeTypeValid(attachment.image_type)) {
					this.log.error(`Invalid mime type ${attachment.image_type} for file ${attachment.title} in room ${message.rid}!`);
					// ignore invalid mime types
					files.push({ name: attachment.title });
					continue;
				}
				let file = message.files?.map((v) => ({ _id: v._id, name: v.name })).find((file) => file.name === attachment.title);
				if (!file) {
					this.log.warn(`File ${attachment.title} not found in room ${message.rid}!`);
					// For some reason, when an image is uploaded from clipboard, it doesn't have a file :(
					// So, we'll try to get the FILE_ID from the `title_link` prop which has the format `/file-upload/FILE_ID/FILE_NAME` using a regex
					const fileId = attachment.title_link?.match(/\/file-upload\/(.*)\/.*/)?.[1];
					if (!fileId) {
						this.log.error(`File ${attachment.title} not found in room ${message.rid}!`);
						// ignore attachments without file
						files.push({ name: attachment.title });
						continue;
					}
					file = { _id: fileId, name: attachment.title || 'upload' };
				}

				if (!file) {
					this.log.warn(`File ${attachment.title} not found in room ${message.rid}!`);
					// ignore attachments without file
					files.push({ name: attachment.title });
					continue;
				}

				const uploadedFile = await Uploads.findOneById(file._id);
				if (!uploadedFile) {
					this.log.error(`Uploaded file ${file._id} not found in room ${message.rid}!`);
					// ignore attachments without file
					files.push({ name: file.name });
					continue;
				}

				try {
					const fileBuffer = await uploadService.getFileBuffer({ file: uploadedFile });
					files.push({ name: file.name, buffer: fileBuffer, extension: uploadedFile.extension });
				} catch (e: unknown) {
					this.log.error(`Failed to get file ${file._id}`, e);
					// Push empty buffer so parser processes this as "unsupported file"
					files.push({ name: file.name });

					// TODO: this is a NATS error message, even when we shouldn't tie it, since it's the only way we have right now we'll live with it for a while
					if ((e as Error).message === 'MAX_PAYLOAD_EXCEEDED') {
						this.log.error(
							`File is too big to be processed by NATS. See NATS config for allowing bigger messages to be sent between services`,
						);
					}
				}
			}

			// When you send a file message, the things you type in the modal are not "msg", they're in "description" of the attachment
			// So, we'll fetch the the msg, if empty, go for the first description on an attachment, if empty, empty string
			const msg = message.msg || message.attachments.find((attachment) => attachment.description)?.description || '';
			// Remove nulls from final array
			messagesData.push({
				msg,
				u: message.u,
				files,
				quotes,
				ts: message.ts,
				md: message.md,
			});
		}

		return messagesData;
	}

	async workOnPdf({ details }: { details: WorkDetailsWithSource }): Promise<void> {
		this.log.info(`Processing transcript for room ${details.rid} by user ${details.userId} - Received from queue`);
		if (this.maxNumberOfConcurrentJobs <= this.currentJobNumber) {
			this.log.error(`Processing transcript for room ${details.rid} by user ${details.userId} - Too many concurrent jobs, queuing again`);
			throw new Error('retry');
		}
		this.currentJobNumber++;
		// TODO: cache these with mem
		const [siteName, dateFormat, timeAndDateFormat, serverLanguage] = await Promise.all([
			settingsService.get<string>('Site_Name'),
			settingsService.get<string>('Message_DateFormat'),
			settingsService.get<string>('Message_TimeAndDateFormat'),
			settingsService.get<string>('Language'),
		]);

		const user = await Users.findOneById<Pick<IUser, '_id' | 'language'>>(details.userId, { projection: { _id: 1, language: 1 } });
		if (!user) return;

		const language = user.language ?? serverLanguage;
		const i18n = this.translator.cloneInstance({ lng: language });

		try {
			const room = await LivechatRooms.findOneById<Pick<IOmnichannelRoom, '_id' | 'v' | 'pdfTranscriptFileId' | 'closedAt' | 'servedBy'>>(
				details.rid,
				{
					projection: { v: 1, servedBy: 1, pdfTranscriptFileId: 1, closedAt: 1 },
				},
			);
			if (!room) {
				throw new Error('room-not-found');
			}
			if (room.pdfTranscriptFileId) {
				this.log.info(`Processing transcript for room ${details.rid} by user ${details.userId} - PDF already exists`);
				return;
			}
			const messages = await this.getMessagesFromRoom({ rid: room._id });

			const visitor = room.v
				? await LivechatVisitors.findOneEnabledById<Pick<ILivechatVisitor, '_id' | 'name' | 'username' | 'visitorEmails'>>(room.v._id, {
						projection: { _id: 1, name: 1, username: 1, visitorEmails: 1 },
					})
				: null;
			const agent = room.servedBy
				? await Users.findOneAgentById<Pick<ILivechatAgent, '_id' | 'name' | 'username' | 'utcOffset'>>(room.servedBy._id, {
						projection: { _id: 1, name: 1, username: 1, utcOffset: 1 },
					})
				: null;

			const messagesData = await this.getMessagesData(messages, i18n.t);

			const timezone = await this.getTimezone(agent);

			this.log.info({ msg: 'Loading translations', language });

			const data: WorkerData = {
				visitor,
				agent,
				closedAt: room.closedAt,
				siteName,
				messages: messagesData,
				dateFormat,
				timeAndDateFormat,
				timezone,
			};

			await this.doRender({ data, details, i18n });
		} catch (error) {
			await this.pdfFailed({ details, e: error as Error, i18n });
		} finally {
			this.currentJobNumber--;
		}
	}

	private async doRender({ data, details, i18n }: { data: WorkerData; details: WorkDetailsWithSource; i18n: i18n }): Promise<void> {
		const transcriptText = i18n.t('Transcript');

		const stream = await this.worker.renderToStream({ data, i18n });
		const outBuff = await streamToBuffer(stream as Readable);

		try {
			const { rid } = await roomService.createDirectMessage({ to: details.userId, from: 'rocket.cat' });
			const [rocketCatFile, transcriptFile] = await this.uploadFiles({
				details,
				buffer: outBuff,
				roomIds: [rid, details.rid],
				data,
				transcriptText,
			});
			await this.pdfComplete({ details, transcriptFile, rocketCatFile, i18n });
		} catch (error) {
			this.pdfFailed({ details, e: error as Error, i18n });
		}
	}

	private async pdfFailed({ details, e, i18n }: { details: WorkDetailsWithSource; e: Error; i18n: i18n }): Promise<void> {
		this.log.error(`Transcript for room ${details.rid} by user ${details.userId} - Failed: ${e.message}`);
		const room = await LivechatRooms.findOneById<Pick<IOmnichannelRoom, '_id'>>(details.rid, { projection: { _id: 1 } });
		if (!room) {
			return;
		}

		const { rid } = await roomService.createDirectMessage({ to: details.userId, from: 'rocket.cat' });
		this.log.info(`Transcript for room ${details.rid} by user ${details.userId} - Sending error message to user`);
		await messageService.sendMessage({
			fromId: 'rocket.cat',
			rid,
			msg: `${i18n.t('pdf_error_message')}: ${e.message}`,
		});
	}

	private async uploadFiles({
		details,
		buffer,
		roomIds,
		data,
		transcriptText,
	}: {
		details: WorkDetailsWithSource;
		buffer: Buffer;
		roomIds: string[];
		data: Pick<WorkerData, 'siteName' | 'visitor'>;
		transcriptText: string;
	}): Promise<IUpload[]> {
		return Promise.all(
			roomIds.map((roomId) => {
				return uploadService.uploadFile({
					userId: details.userId,
					buffer,
					details: {
						// transcript_{company-name}_{date}_{hour}.pdf
						name: `${transcriptText}_${data.siteName}_${new Intl.DateTimeFormat('en-US').format(new Date()).replace(/\//g, '-')}_${
							data.visitor?.name || data.visitor?.username || 'Visitor'
						}.pdf`,
						type: 'application/pdf',
						rid: roomId,
						// Rocket.cat is the goat
						userId: 'rocket.cat',
						size: buffer.length,
					},
				});
			}),
		);
	}

	private async pdfComplete({
		details,
		transcriptFile,
		rocketCatFile,
		i18n,
	}: {
		details: WorkDetailsWithSource;
		transcriptFile: IUpload;
		rocketCatFile: IUpload;
		i18n: i18n;
	}): Promise<void> {
		this.log.info(`Transcript for room ${details.rid} by user ${details.userId} - Complete`);

		// Send the file to the livechat room where this was requested, to keep it in context
		try {
			await LivechatRooms.setPdfTranscriptFileIdById(details.rid, transcriptFile._id);

			this.log.info(`Transcript for room ${details.rid} by user ${details.userId} - Sending success message to user`);
			const result = await Promise.allSettled([
				uploadService.sendFileMessage({
					roomId: details.rid,
					userId: 'rocket.cat',
					file: transcriptFile,
					message: {
						// Translate from service
						msg: i18n.t('pdf_success_message'),
					},
				}),
				// Send the file to the user who requested it, so they can download it
				uploadService.sendFileMessage({
					roomId: rocketCatFile.rid || '',
					userId: 'rocket.cat',
					file: rocketCatFile,
					message: {
						// Translate from service
						msg: i18n.t('pdf_success_message'),
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
