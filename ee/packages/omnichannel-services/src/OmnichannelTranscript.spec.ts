import { Readable } from 'node:stream';
import { setImmediate } from 'node:timers/promises';

import { Upload } from '@rocket.chat/core-services';
import type { IMessage } from '@rocket.chat/core-typings';
import { defaultTranslationNamespace, availableTranslationNamespaces, extractTranslationNamespaces } from '@rocket.chat/i18n';
import { Logger } from '@rocket.chat/logger';
import * as i18next from 'i18next';
import sprintf from 'i18next-sprintf-postprocessor';

import { OmnichannelTranscript } from './OmnichannelTranscript';
import { invalidSystemMessage, messages, validSystemMessage, validTranslatableSystemMessage } from './OmnichannelTranscript.fixtures';

jest.mock('@rocket.chat/pdf-worker', () => ({
	PdfWorker: jest.fn().mockImplementation(() => ({
		renderToStream: jest.fn().mockResolvedValue(Buffer.from('')),
		isMimeTypeValid: jest.fn(() => true),
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

jest.mock('@rocket.chat/models', () => ({
	LivechatRooms: {
		findOneById: jest.fn().mockResolvedValue({}),
	},
	Messages: {
		findLivechatMessagesWithoutTypes: jest.fn().mockReturnValue({
			toArray: jest.fn().mockResolvedValue([]),
		}),
	},
	Uploads: {
		findOneById: jest.fn().mockResolvedValue({}),
	},
	Users: {
		findOneById: jest.fn().mockResolvedValue({}),
		findOneAgentById: jest.fn().mockResolvedValue({}),
	},
	LivechatVisitors: {
		findOneEnabledById: jest.fn().mockResolvedValue({}),
	},
}));

jest.mock('@rocket.chat/tools', () => ({
	guessTimezone: jest.fn().mockReturnValue('UTC'),
	guessTimezoneFromOffset: jest.fn().mockReturnValue('UTC'),
	streamToBuffer: jest.fn().mockResolvedValue(Buffer.from('')),
}));

describe('OmnichannelTranscript', () => {
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
