import type { Readable } from 'stream';

import {
	ServiceClass,
	Upload as uploadService,
	Message as messageService,
	Room as roomService,
	Settings as settingsService,
} from '@rocket.chat/core-services';
import type { IOmnichannelTranscriptService } from '@rocket.chat/core-services';
import type { IMessage, IUpload, ILivechatAgent, AtLeast, IOmnichannelRoom, IUser } from '@rocket.chat/core-typings';
import { isQuoteAttachment, isFileAttachment, isFileImageAttachment } from '@rocket.chat/core-typings';
import type { Logger } from '@rocket.chat/logger';
import { parse } from '@rocket.chat/message-parser';
import { LivechatRooms, Messages, Uploads, Users, LivechatVisitors } from '@rocket.chat/models';
import { PdfWorker } from '@rocket.chat/pdf-worker';
import { guessTimezone, guessTimezoneFromOffset, streamToBuffer } from '@rocket.chat/tools';
import type i18n from 'i18next';

import { getAllSystemMessagesKeys, getSystemMessage } from './livechatSystemMessages';
import type { MessageData, WorkDetailsWithSource, WorkerData, Quote } from './localTypes';
import { isPromiseRejectedResult } from './localTypes';

export class OmnichannelTranscript extends ServiceClass implements IOmnichannelTranscriptService {
	protected name = 'omnichannel-transcript';

	private worker: PdfWorker;

	private log: Logger;

	maxNumberOfConcurrentJobs = 25;

	currentJobNumber = 0;

	private translations?: Array<{ key: string; value: string }> = undefined;

	constructor(
		loggerClass: typeof Logger,
		// Instance of i18n. Should already be init'd and loaded with the translation files
		private readonly translator: typeof i18n,
	) {
		super();
		this.worker = new PdfWorker('chat-transcript');
		// eslint-disable-next-line new-cap
		this.log = new loggerClass('OmnichannelTranscript');
	}

	async getTimezone(user?: AtLeast<ILivechatAgent, 'utcOffset'> | null): Promise<string> {
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

	private getSystemMessage(message: IMessage, serverLanguage: string): false | MessageData {
		if (!message.t) {
			return false;
		}

		const systemMessageDefinition = getSystemMessage(message.t);

		if (!systemMessageDefinition) {
			return false;
		}

		const args = systemMessageDefinition.data && systemMessageDefinition?.data(message, this.translator.t.bind(this.translator));

		const systemMessage = this.translator.t(systemMessageDefinition.message, { lng: serverLanguage, ...args });

		return {
			...message,
			msg: systemMessage,
			files: [],
			quotes: [],
		};
	}

	async getMessagesData(messages: IMessage[], serverLanguage: string): Promise<MessageData[]> {
		const messagesData: MessageData[] = [];
		for await (const message of messages) {
			const systemMessage = this.getSystemMessage(message, serverLanguage);

			if (systemMessage) {
				messagesData.push(systemMessage);
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
					this.log.error(`Invalid attachment type ${(attachment as any).type} for file ${attachment.title} in room ${message.rid}!`);
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

	private getAllTranslations(language: string): Array<{ key: string; value: string }> {
		const keys: string[] = [
			'Agent',
			'Date',
			'Customer',
			'Not_assigned',
			'Time',
			'Chat_transcript',
			'This_attachment_is_not_supported',
			'Livechat_transfer_to_agent',
			'Livechat_transfer_to_agent_with_a_comment',
			'Livechat_transfer_to_department',
			'Livechat_transfer_to_department_with_a_comment',
			'Livechat_transfer_return_to_the_queue',
			'Livechat_transfer_return_to_the_queue_with_a_comment',
			'Livechat_transfer_to_agent_auto_transfer_unanswered_chat',
			'Livechat_transfer_return_to_the_queue_auto_transfer_unanswered_chat',
			'Livechat_visitor_transcript_request',
			'Livechat_user_sent_chat_transcript_to_visitor',
			'WebRTC_call_ended_message',
			'WebRTC_call_declined_message',
			'Without_SLA',
			'Unknown_User',
			'Livechat_transfer_failed_fallback',
			'Unprioritized',
			'Unknown_User',
			'Without_priority',
			...getAllSystemMessagesKeys(),
		];

		return keys.map((key) => ({
			key,
			value: this.translator.t(key, { lng: language }),
		}));
	}

	private loadTranslations(serverLanguage: string) {
		this.log.info({ msg: 'Loading translations', serverLanguage });
		if (!this.translations) {
			this.translations = this.getAllTranslations(serverLanguage);
		}

		return this.translations;
	}

	async workOnPdf({ details }: { details: WorkDetailsWithSource }): Promise<void> {
		this.log.info(`Processing transcript for room ${details.rid} by user ${details.userId} - Received from queue`);
		if (this.maxNumberOfConcurrentJobs <= this.currentJobNumber) {
			this.log.error(`Processing transcript for room ${details.rid} by user ${details.userId} - Too many concurrent jobs, queuing again`);
			throw new Error('retry');
		}
		this.currentJobNumber++;
		// TODO: cache these with mem
		const [siteName, dateFormat, timeAndDateFormat, language] = await Promise.all([
			settingsService.get<string>('Site_Name'),
			settingsService.get<string>('Message_DateFormat'),
			settingsService.get<string>('Message_TimeAndDateFormat'),
			settingsService.get<string>('Language'),
		]);

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

			const visitor =
				room.v &&
				(await LivechatVisitors.findOneEnabledById(room.v._id, { projection: { _id: 1, name: 1, username: 1, visitorEmails: 1 } }));
			const agent =
				room.servedBy && (await Users.findOneAgentById(room.servedBy._id, { projection: { _id: 1, name: 1, username: 1, utcOffset: 1 } }));

			const messagesData = await this.getMessagesData(messages, language);

			const timezone = await this.getTimezone(agent);
			const translations = this.loadTranslations(language);
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
				serverLanguage: language,
			};

			await this.doRender({ data, details });
		} catch (error) {
			await this.pdfFailed({ details, e: error as Error, serverLanguage: language });
		} finally {
			this.currentJobNumber--;
		}
	}

	async doRender({ data, details }: { data: WorkerData; details: WorkDetailsWithSource }): Promise<void> {
		const transcriptText = this.translator.t('Transcript', { lng: data.serverLanguage });

		const stream = await this.worker.renderToStream({ data });
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
			await this.pdfComplete({ details, transcriptFile, rocketCatFile, serverLanguage: data.serverLanguage });
		} catch (e: any) {
			this.pdfFailed({ details, e, serverLanguage: data.serverLanguage });
		}
	}

	private async pdfFailed({
		details,
		e,
		serverLanguage,
	}: {
		details: WorkDetailsWithSource;
		e: Error;
		serverLanguage: string;
	}): Promise<void> {
		this.log.error(`Transcript for room ${details.rid} by user ${details.userId} - Failed: ${e.message}`);
		const room = await LivechatRooms.findOneById<Pick<IOmnichannelRoom, '_id'>>(details.rid, { projection: { _id: 1 } });
		if (!room) {
			return;
		}
		// TODO: fix types of translate service (or deprecate, if possible)
		const user = await Users.findOneById<Pick<IUser, '_id' | 'language'>>(details.userId, { projection: { _id: 1, language: 1 } });
		if (!user) {
			return;
		}

		const { rid } = await roomService.createDirectMessage({ to: details.userId, from: 'rocket.cat' });
		this.log.info(`Transcript for room ${details.rid} by user ${details.userId} - Sending error message to user`);
		await messageService.sendMessage({
			fromId: 'rocket.cat',
			rid,
			msg: `${this.translator.t('pdf_error_message', { lng: user.language || serverLanguage, fallbackLng: 'en' })}: ${e.message}`,
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
		data: any;
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
		serverLanguage,
	}: {
		details: WorkDetailsWithSource;
		transcriptFile: IUpload;
		rocketCatFile: IUpload;
		serverLanguage: string;
	}): Promise<void> {
		this.log.info(`Transcript for room ${details.rid} by user ${details.userId} - Complete`);
		const user = await Users.findOneById(details.userId);
		if (!user) {
			return;
		}
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
						msg: this.translator.t('pdf_success_message', { lng: serverLanguage }),
					},
				}),
				// Send the file to the user who requested it, so they can download it
				uploadService.sendFileMessage({
					roomId: rocketCatFile.rid || '',
					userId: 'rocket.cat',
					file: rocketCatFile,
					message: {
						// Translate from service
						msg: this.translator.t('pdf_success_message', { lng: user.language || serverLanguage, fallbackLng: 'en' }),
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
