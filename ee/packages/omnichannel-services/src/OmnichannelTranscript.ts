import type { Readable } from 'stream';

import {
	ServiceClass,
	Upload as uploadService,
	Message as messageService,
	Room as roomService,
	Translation as translationService,
	Settings as settingsService,
} from '@rocket.chat/core-services';
import type { IOmnichannelTranscriptService } from '@rocket.chat/core-services';
import type {
	IMessage,
	IUser,
	IRoom,
	IUpload,
	ILivechatVisitor,
	ILivechatAgent,
	IOmnichannelSystemMessage,
	AtLeast,
} from '@rocket.chat/core-typings';
import { isQuoteAttachment, isFileAttachment, isFileImageAttachment } from '@rocket.chat/core-typings';
import type { Logger } from '@rocket.chat/logger';
import { parse } from '@rocket.chat/message-parser';
import type { Root } from '@rocket.chat/message-parser';
import { LivechatRooms, Messages, Uploads, Users, LivechatVisitors } from '@rocket.chat/models';
import { PdfWorker } from '@rocket.chat/pdf-worker';
import { guessTimezone, guessTimezoneFromOffset, streamToBuffer } from '@rocket.chat/tools';

import { getAllSystemMessagesKeys, getSystemMessage } from './livechatSystemMessages';

const isPromiseRejectedResult = (result: any): result is PromiseRejectedResult => result.status === 'rejected';

type WorkDetails = {
	rid: IRoom['_id'];
	userId: IUser['_id'];
};

type WorkDetailsWithSource = WorkDetails & {
	from: string;
};

type Quote = { name: string; ts?: Date; md: Root };

export type MessageData = Pick<
	IOmnichannelSystemMessage,
	| 'msg'
	| '_id'
	| 'u'
	| 'ts'
	| 'md'
	| 't'
	| 'navigation'
	| 'transferData'
	| 'requestData'
	| 'webRtcCallEndTs'
	| 'comment'
	| 'slaData'
	| 'priorityData'
> & {
	files: ({ name?: string; buffer?: Buffer; extension?: string } | undefined)[];
	quotes: (Quote | undefined)[];
};

type WorkerData = {
	siteName: string;
	visitor: Pick<ILivechatVisitor, '_id' | 'username' | 'name' | 'visitorEmails'> | null;
	agent: ILivechatAgent | undefined | null;
	closedAt?: Date;
	messages: MessageData[];
	timezone: string;
	dateFormat: string;
	timeAndDateFormat: string;
	translations: { key: string; value: string }[];
};

const customSprintfInterpolation = (template: string, values: Record<string, string>) => {
	return template.replace(/{{(\w+)}}/g, (match, key) => {
		return typeof values[key] !== 'undefined' ? values[key] : match;
	});
};

export class OmnichannelTranscript extends ServiceClass implements IOmnichannelTranscriptService {
	protected name = 'omnichannel-transcript';

	private worker: PdfWorker;

	private log: Logger;

	// this is initialized as undefined and will be set when the first pdf is requested.
	// if we try to initialize it at the start of the service using IIAFE, for some reason i18next doesn't return translations, maybe i18n isn't initialised yet
	private translations?: Array<{ key: string; value: string }> = undefined;

	maxNumberOfConcurrentJobs = 25;

	currentJobNumber = 0;

	constructor(loggerClass: typeof Logger) {
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

	private getSystemMessage(message: IMessage): false | MessageData {
		if (!message.t) {
			return false;
		}

		const systemMessageDefinition = getSystemMessage(message.t);

		if (!systemMessageDefinition) {
			return false;
		}

		const args = systemMessageDefinition.data && systemMessageDefinition?.data(message, this.getTranslation.bind(this));

		const systemMessage = this.getTranslation(systemMessageDefinition.message, args);

		return {
			...message,
			msg: systemMessage,
			files: [],
			quotes: [],
		};
	}

	async getMessagesData(messages: IMessage[]): Promise<MessageData[]> {
		const messagesData: MessageData[] = [];
		for await (const message of messages) {
			const systemMessage = this.getSystemMessage(message);

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

	private async getAllTranslations(): Promise<Array<{ key: string; value: string }>> {
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

		return translationService.translateMultipleToServerLanguage(keys);
	}

	private getTranslation(translationKey: string, args?: Record<string, string>): string {
		const translationValue = this.translations?.find(({ key }) => key === translationKey)?.value;

		if (!translationValue) {
			return translationKey;
		}

		if (!args) {
			return translationValue;
		}

		const translation = customSprintfInterpolation(translationValue, args);

		return translation;
	}

	private async loadTranslations() {
		if (!this.translations) {
			this.translations = await this.getAllTranslations();
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
		try {
			const room = await LivechatRooms.findOneById(details.rid);
			if (!room) {
				throw new Error('room-not-found');
			}
			const messages = await this.getMessagesFromRoom({ rid: room._id });

			const visitor =
				room.v &&
				(await LivechatVisitors.findOneEnabledById(room.v._id, { projection: { _id: 1, name: 1, username: 1, visitorEmails: 1 } }));
			const agent =
				room.servedBy && (await Users.findOneAgentById(room.servedBy._id, { projection: { _id: 1, name: 1, username: 1, utcOffset: 1 } }));

			const translations = await this.loadTranslations();

			const messagesData = await this.getMessagesData(messages);

			const [siteName, dateFormat, timeAndDateFormat, timezone] = await Promise.all([
				settingsService.get<string>('Site_Name'),
				settingsService.get<string>('Message_DateFormat'),
				settingsService.get<string>('Message_TimeAndDateFormat'),
				this.getTimezone(agent),
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
			const { rid } = await roomService.createDirectMessage({ to: details.userId, from: 'rocket.cat' });
			const [rocketCatFile, transcriptFile] = await this.uploadFiles({
				details,
				buffer: outBuff,
				roomIds: [rid, details.rid],
				data,
				transcriptText,
			});
			await this.pdfComplete({ details, transcriptFile, rocketCatFile });
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
	}: {
		details: WorkDetailsWithSource;
		transcriptFile: IUpload;
		rocketCatFile: IUpload;
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
						msg: await translationService.translateToServerLanguage('pdf_success_message'),
					},
				}),
				// Send the file to the user who requested it, so they can download it
				uploadService.sendFileMessage({
					roomId: rocketCatFile.rid || '',
					userId: 'rocket.cat',
					file: rocketCatFile,
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
