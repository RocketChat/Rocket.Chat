import type { IMessage } from '@rocket.chat/core-typings';
import { Logger } from '@rocket.chat/logger';

import { OmnichannelTranscript } from './OmnichannelTranscript';
import { invalidSystemMessage, messages, validSystemMessage } from './OmnichannelTranscript.fixtures';

jest.mock('@rocket.chat/pdf-worker', () => ({
	PdfWorker: jest.fn().mockImplementation(() => ({
		renderToStream: jest.fn().mockResolvedValue(Buffer.from('')),
		isMimeTypeValid: jest.fn(() => true),
	})),
}));

jest.mock('@rocket.chat/core-services', () => ({
	ServiceClass: class {},
	Upload: {
		getFileBuffer: jest.fn().mockResolvedValue(Buffer.from('')),
		uploadFile: jest.fn().mockResolvedValue({ _id: 'fileId', name: 'fileName' }),
		sendFileMessage: jest.fn(),
	},
	Message: {
		sendMessage: jest.fn(),
	},
	Room: {
		createDirectMessage: jest.fn().mockResolvedValue({ rid: 'roomId' }),
	},
	Translation: {
		translate: jest.fn().mockResolvedValue('translated message'),
		translateToServerLanguage: jest.fn().mockResolvedValue('translated server message'),
		translateMultipleToServerLanguage: jest.fn((keys) => keys.map((key: any) => ({ key, value: key }))),
	},
	Settings: {
		get: jest.fn().mockResolvedValue(''),
	},
}));

jest.mock('@rocket.chat/models', () => ({
	LivechatRooms: {
		findOneById: jest.fn().mockResolvedValue({}),
		unsetTranscriptRequestedPdfById: jest.fn(),
		setPdfTranscriptFileIdById: jest.fn(),
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

	beforeEach(() => {
		omnichannelTranscript = new OmnichannelTranscript(Logger);
	});

	it('should return default timezone', async () => {
		const timezone = await omnichannelTranscript.getTimezone();
		expect(timezone).toBe('UTC');
	});

	it('should parse the messages', async () => {
		const parsedMessages = await omnichannelTranscript.getMessagesData(messages as unknown as IMessage[]);
		console.log(parsedMessages[0]);
		expect(parsedMessages).toBeDefined();
		expect(parsedMessages).toHaveLength(3);
		expect(parsedMessages[0]).toHaveProperty('files');
		expect(parsedMessages[0].files).toHaveLength(0);
		expect(parsedMessages[0]).toHaveProperty('quotes');
		expect(parsedMessages[0].quotes).toHaveLength(0);
	});

	it('should parse system message', async () => {
		const parsedMessages = await omnichannelTranscript.getMessagesData([...messages, validSystemMessage] as unknown as IMessage[]);
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

	it('should parse an invalid system message', async () => {
		const parsedMessages = await omnichannelTranscript.getMessagesData([...messages, invalidSystemMessage] as unknown as IMessage[]);
		const systemMessage = parsedMessages[3];
		console.log(parsedMessages[3]);
		expect(parsedMessages).toBeDefined();
		expect(parsedMessages).toHaveLength(4);
		expect(systemMessage).toHaveProperty('t');
		expect(systemMessage.t).toBe('some-system-message');
		expect(systemMessage.msg).toBeUndefined();
	});
});
