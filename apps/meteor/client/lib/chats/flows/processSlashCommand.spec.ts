import { processSlashCommand } from './processSlashCommand';
import { createFakeMessage } from '../../../../tests/mocks/data';
import type { ChatAPI } from '../ChatAPI';
import { slashCommands } from '../../../../app/utils/client';
import { sdk } from '../../../../app/utils/client/lib/SDKClient';

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
		slashCommands.commands['test'] = {
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

	it('should parse parameters spanning multiple lines correctly (dotall support)', async () => {
		await processSlashCommand(mockChat, { ...message, msg: '/test param1\nparam2' });

		expect(sdk.rest.post).toHaveBeenCalledWith('/v1/commands.run', {
			command: 'test',
			params: ' param1\nparam2',
			roomId: message.rid,
			triggerId: 'trigger-123',
		});
	});

	it('should parse quoted parameters spanning multiple lines correctly', async () => {
		await processSlashCommand(mockChat, { ...message, msg: '/test "quoted\nparam"' });

		expect(sdk.rest.post).toHaveBeenCalledWith('/v1/commands.run', {
			command: 'test',
			params: ' "quoted\nparam"',
			roomId: message.rid,
			triggerId: 'trigger-123',
		});
	});
});
