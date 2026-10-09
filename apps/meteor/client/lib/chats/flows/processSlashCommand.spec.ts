import { slashCommands } from '../../../../app/utils/client';
import { sdk } from '../../../../app/utils/client/lib/SDKClient';
import { parseParameters } from '../../../../lib/utils/parseParameters';
import { createFakeMessage } from '../../../../tests/mocks/data';
import type { ChatAPI } from '../ChatAPI';
import { processSlashCommand } from './processSlashCommand';

jest.mock('../../../../app/authorization/client', () => ({
	hasAtLeastOnePermission: jest.fn(() => true),
}));

jest.mock('../../../../app/utils/client', () => ({
	slashCommands: {
		commands: {},
	},
}));

jest.mock('../../../../app/utils/client/lib/SDKClient', () => ({
	sdk: {
		rest: {
			post: jest.fn().mockResolvedValue({ result: {} }),
		},
	},
}));

jest.mock('../../../../app/utils/lib/i18n', () => ({
	t: jest.fn((key) => key),
}));

jest.mock('../../settings', () => ({
	settings: {
		peek: jest.fn(() => true),
	},
}));

const mockChat = {
	uid: 'user-123',
	composer: {
		clear: jest.fn(),
	},
	ActionManager: {
		generateTriggerId: jest.fn(() => 'trigger-123'),
		notifyBusy: jest.fn(),
		notifyIdle: jest.fn(),
	},
	data: {
		pushEphemeralMessage: jest.fn(),
	},
} as unknown as ChatAPI;

const message = createFakeMessage({
	_id: 'message-id',
	rid: 'room-id',
});

describe('processSlashCommand', () => {
	beforeEach(() => {
		jest.clearAllMocks();
		slashCommands.commands.test = {
			command: 'test',
			clientOnly: false,
		} as any;
	});

	it('should parse single-line parameters correctly', async () => {
		await processSlashCommand(mockChat, { ...message, msg: '/test param1 param2' });

		expect(sdk.rest.post).toHaveBeenCalledWith('/v1/commands.run', {
			command: 'test',
			params: ' param1 param2',
			roomId: message.rid,
			triggerId: 'trigger-123',
		});
	});

	it('should pass params with an LF line break through to commands.run untruncated', async () => {
		await processSlashCommand(mockChat, { ...message, msg: '/test param1\nparam2' });

		expect(sdk.rest.post).toHaveBeenCalledWith('/v1/commands.run', {
			command: 'test',
			params: ' param1\nparam2',
			roomId: message.rid,
			triggerId: 'trigger-123',
		});
	});

	it('should pass params with a CRLF line break through to commands.run untruncated', async () => {
		await processSlashCommand(mockChat, { ...message, msg: '/test param1\r\nparam2' });

		expect(sdk.rest.post).toHaveBeenCalledWith('/v1/commands.run', {
			command: 'test',
			params: ' param1\r\nparam2',
			roomId: message.rid,
			triggerId: 'trigger-123',
		});
	});

	it('should pass params containing an intentional blank line through to commands.run untruncated (LF)', async () => {
		await processSlashCommand(mockChat, { ...message, msg: '/test param1\n\nparam2' });

		expect(sdk.rest.post).toHaveBeenCalledWith('/v1/commands.run', {
			command: 'test',
			params: ' param1\n\nparam2',
			roomId: message.rid,
			triggerId: 'trigger-123',
		});
	});

	it('should pass params containing an intentional blank line through to commands.run untruncated (CRLF)', async () => {
		await processSlashCommand(mockChat, { ...message, msg: '/test param1\r\n\r\nparam2' });

		expect(sdk.rest.post).toHaveBeenCalledWith('/v1/commands.run', {
			command: 'test',
			params: ' param1\r\n\r\nparam2',
			roomId: message.rid,
			triggerId: 'trigger-123',
		});
	});

	describe('composer input paths (typed Shift+Enter vs. pasted multi-line text)', () => {
		it('should handle typed Shift+Enter line break (inserts \\n into composer text)', async () => {
			// In composer, Shift+Enter triggers insertNewLine() which inserts a literal '\n'
			const typedText = '/test param1\nparam2\nparam3';
			await processSlashCommand(mockChat, { ...message, msg: typedText });

			expect(sdk.rest.post).toHaveBeenCalledWith('/v1/commands.run', {
				command: 'test',
				params: ' param1\nparam2\nparam3',
				roomId: message.rid,
				triggerId: 'trigger-123',
			});
		});

		it('should handle pasted multi-line text (preserves CRLF clipboard format without composer normalization differences)', async () => {
			// On Windows / certain clipboards, pasted multi-line text contains '\r\n'
			const pastedText = '/test param1\r\nparam2\r\nparam3';
			await processSlashCommand(mockChat, { ...message, msg: pastedText });

			expect(sdk.rest.post).toHaveBeenCalledWith('/v1/commands.run', {
				command: 'test',
				params: ' param1\r\nparam2\r\nparam3',
				roomId: message.rid,
				triggerId: 'trigger-123',
			});
		});
	});

	describe('quoted multi-line arguments and server parseParameters consistency', () => {
		it('should pass quoted multi-line argument followed by unquoted trailing argument so server parseParameters matches', async () => {
			const rawCommand = '/test "line one\nline two" trailing';
			await processSlashCommand(mockChat, { ...message, msg: rawCommand });

			const postCall = (sdk.rest.post as jest.Mock).mock.calls.find((call) => call[0] === '/v1/commands.run');
			expect(postCall).toBeDefined();

			const sentParams = postCall[1].params;
			// Client passes the raw, untruncated multi-line params string through unchanged
			expect(sentParams).toBe(' "line one\nline two" trailing');

			// Assert that what the client sent parses with server-side parseParameters
			// to preserve newlines inside quotes while splitting on whitespace outside
			const serverParsed = parseParameters(sentParams);
			expect(serverParsed).toEqual(['line one\nline two', 'trailing']);
		});

		it('should pass quoted multi-line argument with CRLF followed by unquoted trailing argument matching parseParameters', async () => {
			const rawCommand = '/test "line one\r\nline two" trailing';
			await processSlashCommand(mockChat, { ...message, msg: rawCommand });

			const postCall = (sdk.rest.post as jest.Mock).mock.calls.find((call) => call[0] === '/v1/commands.run');
			expect(postCall).toBeDefined();

			const sentParams = postCall[1].params;
			expect(sentParams).toBe(' "line one\r\nline two" trailing');

			const serverParsed = parseParameters(sentParams);
			expect(serverParsed).toEqual(['line one\r\nline two', 'trailing']);
		});

		it('should let server parseParameters treat unquoted newlines as argument separators without client pre-splitting', async () => {
			const rawCommand = '/test arg1\narg2\r\narg3';
			await processSlashCommand(mockChat, { ...message, msg: rawCommand });

			const postCall = (sdk.rest.post as jest.Mock).mock.calls.find((call) => call[0] === '/v1/commands.run');
			const sentParams = postCall[1].params;

			expect(sentParams).toBe(' arg1\narg2\r\narg3');
			expect(parseParameters(sentParams)).toEqual(['arg1', 'arg2', 'arg3']);
		});
	});
});
