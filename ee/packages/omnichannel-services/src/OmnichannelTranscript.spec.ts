import { Readable } from 'node:stream';
import { setImmediate } from 'node:timers/promises';

import { Message, Room, Upload } from '@rocket.chat/core-services';
import type { IMessage } from '@rocket.chat/core-typings';
import { defaultTranslationNamespace, availableTranslationNamespaces, extractTranslationNamespaces } from '@rocket.chat/i18n';
import { Logger } from '@rocket.chat/logger';
import { parse } from '@rocket.chat/message-parser';
import { mockModel } from '@rocket.chat/models/testing';
import { guessTimezoneFromOffset, streamToBuffer } from '@rocket.chat/tools';
import * as i18next from 'i18next';
import sprintf from 'i18next-sprintf-postprocessor';

import { OmnichannelTranscript } from './OmnichannelTranscript';
import { invalidSystemMessage, messages, validSystemMessage, validTranslatableSystemMessage } from './OmnichannelTranscript.fixtures';

const mockRenderToStream = jest.fn();

jest.mock('@rocket.chat/pdf-worker', () => ({
	PdfWorker: jest.fn().mockImplementation(() => ({
		renderToStream: (...args: unknown[]) => mockRenderToStream(...args),
		isMimeTypeValid: (mimeType: string) => mimeType === 'image/png',
	})),
}));

jest.mock('@rocket.chat/core-services', () => ({
	ServiceClass: class {
		onSettingChanged = jest.fn();
	},
	Upload: {
		getFileBuffer: jest.fn().mockResolvedValue(Buffer.from('')),
		uploadFile: jest.fn().mockResolvedValue({ _id: 'fileId', name: 'fileName' }),
		uploadFileFromStream: jest.fn(),
		sendFileMessage: jest.fn(),
		streamUploadedFile: jest.fn(),
	},
	Message: {
		sendMessage: jest.fn(),
	},
	Room: {
		createDirectMessage: jest.fn().mockResolvedValue({ rid: 'roomId' }),
	},
	Settings: {
		get: jest.fn().mockResolvedValue(''),
	},
}));

jest.mock('@rocket.chat/tools', () => ({
	guessTimezone: jest.fn().mockReturnValue('UTC'),
	guessTimezoneFromOffset: jest.fn().mockReturnValue('UTC'),
	streamToBuffer: jest.fn().mockResolvedValue(Buffer.from('')),
}));

describe('OmnichannelTranscript', () => {
	beforeAll(() => {
		mockModel('LivechatRooms', {
			findOneById: jest.fn().mockResolvedValue({}),
		});
		mockModel('Messages', {
			findLivechatMessagesWithoutTypes: jest.fn().mockReturnValue({
				toArray: jest.fn().mockResolvedValue([]),
			}),
		});
		mockModel('Uploads', {
			findOneById: jest.fn().mockResolvedValue({}),
		});
		mockModel('Users', {
			findOneById: jest.fn().mockResolvedValue({}),
			findOneAgentById: jest.fn().mockResolvedValue({}),
		});
		mockModel('LivechatVisitors', {
			findOneEnabledById: jest.fn().mockResolvedValue({}),
		});
	});

	let omnichannelTranscript: OmnichannelTranscript;

	beforeEach(async () => {
		const i18n = i18next.use(sprintf);
		i18next.use(sprintf);
		await i18n.init({
			lng: 'en',
			fallbackLng: 'en',
			defaultNS: defaultTranslationNamespace,
			ns: availableTranslationNamespaces,
			nsSeparator: '.',
			resources: {
				en: extractTranslationNamespaces({
					Conversation_closed: 'Conversation closed: {{comment}}.',
					pdf_success_message: 'PDF Transcript successfully generated',
					pdf_error_message: 'Error generating PDF Transcript',
				}),
				pt: extractTranslationNamespaces({
					pdf_success_message: 'Transcrição em PDF gerada com sucesso',
				}),
			},
		});

		omnichannelTranscript = new OmnichannelTranscript(Logger, i18n);
	});

	it('should return default timezone', async () => {
		const timezone = await omnichannelTranscript.getTimezone();
		expect(timezone).toBe('UTC');
	});

	it('should parse the messages', async () => {
		const parsedMessages = await omnichannelTranscript.getMessagesData(messages as unknown as IMessage[], i18next.t);
		expect(parsedMessages).toBeDefined();
		expect(parsedMessages).toHaveLength(3);
		expect(parsedMessages[0]).toHaveProperty('files');
		expect(parsedMessages[0].files).toHaveLength(0);
		expect(parsedMessages[0]).toHaveProperty('quotes');
		expect(parsedMessages[0].quotes).toHaveLength(0);
	});

	it('should parse system message without a valid translation key', async () => {
		const parsedMessages = await omnichannelTranscript.getMessagesData(
			[...messages, validSystemMessage] as unknown as IMessage[],
			i18next.t,
		);
		const systemMessage = parsedMessages[3];
		expect(parsedMessages).toBeDefined();
		expect(parsedMessages).toHaveLength(4);
		expect(systemMessage).toHaveProperty('t');
		expect(systemMessage.t).toBe('livechat-started');
		expect(systemMessage).toHaveProperty('msg');
		expect(systemMessage.msg).toBe('Chat_started');
		expect(systemMessage).toHaveProperty('files');
		expect(systemMessage.files).toHaveLength(0);
		expect(systemMessage).toHaveProperty('quotes');
		expect(systemMessage.quotes).toHaveLength(0);
	});

	it('should translate a system message with available translation keys', async () => {
		const parsedMessages = await omnichannelTranscript.getMessagesData(
			[...messages, validTranslatableSystemMessage] as unknown as IMessage[],
			i18next.t,
		);
		const systemMessage = parsedMessages[3];
		expect(parsedMessages).toBeDefined();
		expect(parsedMessages).toHaveLength(4);
		expect(systemMessage).toHaveProperty('t');
		expect(systemMessage.t).toBe('livechat-close');
		expect(systemMessage).toHaveProperty('msg');
		expect(systemMessage.msg).toBe('Conversation closed: Conversation closed by user.');
		expect(systemMessage).toHaveProperty('files');
		expect(systemMessage.files).toHaveLength(0);
		expect(systemMessage).toHaveProperty('quotes');
		expect(systemMessage.quotes).toHaveLength(0);
	});

	it('should translate a system message to the default language when the server language provided doesnt work', async () => {
		const parsedMessages = await omnichannelTranscript.getMessagesData(
			[...messages, validTranslatableSystemMessage] as unknown as IMessage[],
			i18next.getFixedT('es'),
		);
		const systemMessage = parsedMessages[3];
		expect(parsedMessages).toBeDefined();
		expect(parsedMessages).toHaveLength(4);
		expect(systemMessage).toHaveProperty('t');
		expect(systemMessage.t).toBe('livechat-close');
		expect(systemMessage).toHaveProperty('msg');
		expect(systemMessage.msg).toBe('Conversation closed: Conversation closed by user.');
		expect(systemMessage).toHaveProperty('files');
		expect(systemMessage.files).toHaveLength(0);
		expect(systemMessage).toHaveProperty('quotes');
		expect(systemMessage.quotes).toHaveLength(0);
	});

	it('should parse an invalid system message', async () => {
		const parsedMessages = await omnichannelTranscript.getMessagesData(
			[...messages, invalidSystemMessage] as unknown as IMessage[],
			i18next.t,
		);
		const systemMessage = parsedMessages[3];
		expect(parsedMessages).toBeDefined();
		expect(parsedMessages).toHaveLength(4);
		expect(systemMessage).toHaveProperty('t');
		expect(systemMessage.t).toBe('some-system-message');
		expect(systemMessage.msg).toBeUndefined();
	});

	const applySetting = (id: string, value: unknown) =>
		jest
			.mocked((omnichannelTranscript as unknown as { onSettingChanged: jest.Mock }).onSettingChanged)
			.mock.calls.find(([settingId]) => settingId === id)?.[1]({ setting: { value } });

	describe('getTimezone', () => {
		it('uses the custom timezone when reports use a custom one', async () => {
			applySetting('Default_Timezone_For_Reporting', 'custom');
			applySetting('Default_Custom_Timezone', 'America/New_York');

			await expect(omnichannelTranscript.getTimezone({ utcOffset: -3 })).resolves.toBe('America/New_York');
		});

		it("uses the agent's timezone when reports use the user's one", async () => {
			jest.mocked(guessTimezoneFromOffset).mockImplementationOnce((offset) => `offset ${offset}`);
			applySetting('Default_Timezone_For_Reporting', 'user');

			await expect(omnichannelTranscript.getTimezone({ utcOffset: -3 })).resolves.toBe('offset -3');
		});

		it("uses the server's timezone when reports use the user's one and the agent has no offset", async () => {
			applySetting('Default_Timezone_For_Reporting', 'user');

			await expect(omnichannelTranscript.getTimezone(null)).resolves.toBe('UTC');
		});
	});

	describe('getMessagesData', () => {
		const imageAttachment = {
			type: 'file',
			title: 'receipt.png',
			title_link: '/file-upload/file-id/receipt.png',
			image_url: '/file-upload/file-id/receipt.png',
			image_type: 'image/png',
		};

		const parseMessage = async (message: Partial<IMessage>) => {
			const [data] = await omnichannelTranscript.getMessagesData(
				[{ u: { _id: 'visitor-id' }, msg: '', ...message } as IMessage],
				i18next.t,
			);
			return data;
		};

		const findUpload = jest.fn();

		beforeEach(() => {
			findUpload.mockReset().mockResolvedValue({ _id: 'file-id', extension: 'png' });
			mockModel('Uploads', { findOneById: findUpload });
			jest.mocked(streamToBuffer).mockResolvedValue(Buffer.from('image'));
		});

		it('embeds an image sent in the chat, with its extension', async () => {
			const data = await parseMessage({ attachments: [imageAttachment], files: [{ _id: 'file-id', name: 'receipt.png' } as any] });

			expect(data.files).toEqual([{ name: 'receipt.png', buffer: Buffer.from('image'), extension: 'png' }]);
		});

		it('finds a pasted image, which has no file entry, through its link', async () => {
			const data = await parseMessage({ attachments: [imageAttachment] });

			expect(findUpload).toHaveBeenCalledWith('file-id');
			expect(data.files).toEqual([{ name: 'receipt.png', buffer: Buffer.from('image'), extension: 'png' }]);
		});

		it.each([
			['a file that is not an image', { type: 'file', title: 'contract.pdf' }],
			['an image of a type the PDF cannot show', { ...imageAttachment, image_type: 'image/heic' }],
		])('lists %s by name only', async (_, attachment) => {
			const data = await parseMessage({ attachments: [attachment] });

			expect(data.files).toEqual([{ name: attachment.title }]);
		});

		it('lists an image by name only when its file cannot be read', async () => {
			jest.mocked(Upload.streamUploadedFile).mockRejectedValueOnce(new Error('MAX_PAYLOAD_EXCEEDED'));

			const data = await parseMessage({ attachments: [imageAttachment], files: [{ _id: 'file-id', name: 'receipt.png' } as any] });

			expect(data.files).toEqual([{ name: 'receipt.png' }]);
		});

		it('uses the caption of a file message as its text', async () => {
			const data = await parseMessage({ attachments: [{ type: 'file', title: 'contract.pdf', description: 'Signed contract' }] });

			expect(data.msg).toBe('Signed contract');
		});

		it('shows quoted messages, nested ones included, as quotes', async () => {
			const data = await parseMessage({
				msg: 'Still waiting',
				attachments: [
					{
						message_link: 'https://open.rocket.chat/live/room?msg=1',
						author_name: 'agent',
						text: 'We will call you',
						attachments: [{ message_link: 'https://open.rocket.chat/live/room?msg=0', author_name: 'visitor', text: 'Call me' }],
					},
				],
			});

			expect(data.quotes).toEqual([
				expect.objectContaining({ name: 'agent', md: parse('We will call you') }),
				expect.objectContaining({ name: 'visitor', md: parse('Call me') }),
			]);
		});
	});

	describe('workOnPdf', () => {
		const details = { rid: 'livechat-room-id', userId: 'agent-id', from: 'omnichannel-transcript' } as const;
		const findRoom = jest.fn();
		const findRequester = jest.fn();
		const setPdfTranscriptFileIdById = jest.fn();

		beforeEach(() => {
			findRoom.mockReset().mockResolvedValue({ _id: 'livechat-room-id', v: { _id: 'visitor-id' }, servedBy: { _id: 'agent-id' } });
			findRequester.mockReset().mockResolvedValue({ _id: 'agent-id' });
			mockModel('LivechatRooms', { findOneById: findRoom, setPdfTranscriptFileIdById });
			mockModel('Users', {
				findOneById: findRequester,
				findOneAgentById: jest.fn().mockResolvedValue({ _id: 'agent-id', utcOffset: 0 }),
			});
			mockRenderToStream.mockReset().mockResolvedValue(Readable.from([Buffer.from('pdf')]));
			jest
				.mocked(Upload.uploadFileFromStream)
				.mockImplementation(async ({ details }) => ({ _id: `pdf-in-${details.rid}`, rid: details.rid }) as any);
			jest.mocked(Upload.sendFileMessage).mockClear();
			jest.mocked(Room.createDirectMessage).mockClear();
		});

		it.each([
			['their own language', { _id: 'agent-id', language: 'pt' }, 'en'],
			['the server language when they have none', { _id: 'agent-id' }, 'pt'],
		])('sends the PDF to the room and to the requester, in %s', async (_, user, serverLanguage) => {
			findRequester.mockResolvedValue(user);
			applySetting('Language', serverLanguage);

			await omnichannelTranscript.workOnPdf({ details });

			expect(setPdfTranscriptFileIdById).toHaveBeenCalledWith('livechat-room-id', 'pdf-in-livechat-room-id');
			expect(jest.mocked(Upload.sendFileMessage).mock.calls.map(([{ roomId, message }]) => [roomId, message?.msg])).toEqual([
				['livechat-room-id', 'Transcrição em PDF gerada com sucesso'],
				['roomId', 'Transcrição em PDF gerada com sucesso'],
			]);
		});

		it('does not render again when the room already has a PDF transcript', async () => {
			findRoom.mockResolvedValue({ _id: 'livechat-room-id', pdfTranscriptFileId: 'pdf-id' });

			await omnichannelTranscript.workOnPdf({ details });

			expect(mockRenderToStream).not.toHaveBeenCalled();
		});

		it('asks the queue to retry when too many transcripts are running', async () => {
			omnichannelTranscript.currentJobNumber = omnichannelTranscript.maxNumberOfConcurrentJobs;

			await expect(omnichannelTranscript.workOnPdf({ details })).rejects.toThrow('retry');

			expect(mockRenderToStream).not.toHaveBeenCalled();
		});

		it('tells the requester why the PDF failed and frees the job slot', async () => {
			mockRenderToStream.mockRejectedValue(new Error('font missing'));

			await omnichannelTranscript.workOnPdf({ details });

			expect(Room.createDirectMessage).toHaveBeenCalledWith({ to: 'agent-id', from: 'rocket.cat' });
			expect(Message.sendMessage).toHaveBeenCalledWith({
				fromId: 'rocket.cat',
				rid: 'roomId',
				msg: 'Error generating PDF Transcript: font missing',
			});
			expect(omnichannelTranscript.currentJobNumber).toBe(0);
		});
	});

	describe('uploadFiles', () => {
		const pdf = Array.from({ length: 50 }, (_, i) => Buffer.alloc(1024, i));

		const upload = (roomIds: string[], stream: Readable) =>
			(omnichannelTranscript as any).uploadFiles({
				stream,
				roomIds,
				data: { siteName: 'site', visitor: { name: 'visitor' } },
				transcriptText: 'transcript',
			});

		const readAll = async (stream: Readable): Promise<Buffer> => {
			const chunks: Buffer[] = [];
			for await (const chunk of stream) {
				chunks.push(chunk);
			}
			return Buffer.concat(chunks);
		};

		it('should upload the whole transcript to every room, even when an upload starts reading late', async () => {
			let calls = 0;
			jest.mocked(Upload.uploadFileFromStream).mockImplementation(async ({ streamParam, details }) => {
				// a remote upload starts consuming only after its request went over the wire
				if (calls++ > 0) {
					await setImmediate();
				}
				const content = await readAll(streamParam);
				return { _id: details.rid, size: content.length } as any;
			});

			const uploads = await upload(['room1', 'room2'], Readable.from(pdf));

			expect(uploads).toEqual([
				{ _id: 'room1', size: 50 * 1024 },
				{ _id: 'room2', size: 50 * 1024 },
			]);
		});

		it('should fail every upload when the render fails', async () => {
			jest.mocked(Upload.uploadFileFromStream).mockImplementation(async ({ streamParam }) => {
				await readAll(streamParam);
				return {} as any;
			});

			const stream = new Readable({
				read() {
					// never produces data: the render fails before the first chunk
				},
			});
			const result = upload(['room1', 'room2'], stream);
			stream.destroy(new Error('render failed'));

			await expect(result).rejects.toThrow('render failed');
		});
	});
});
