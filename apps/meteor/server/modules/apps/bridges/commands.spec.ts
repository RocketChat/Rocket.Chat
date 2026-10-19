import type { ISlashCommand } from '@rocket.chat/apps-engine/definition/slashcommands';
import type { SlashCommand } from '@rocket.chat/core-typings';

import { AppCommandsBridge } from './commands';
import { slashCommands } from '../../../lib/utils/slashCommand';

jest.mock('../../../lib/utils/slashCommand', () => ({
	slashCommands: { commands: {} },
}));

const mockOrch = {
	debugLog: jest.fn(),
	getNotifier: () => ({ commandUpdated: jest.fn() }),
} as any;

describe('AppCommandsBridge#modifyCommand', () => {
	beforeEach(() => {
		slashCommands.commands.topic = {
			command: 'topic',
			params: '<topic>',
			description: 'Set the topic of the room',
			permission: undefined,
			providesPreview: false,
			clientOnly: false,
			callback: jest.fn(),
		} as unknown as SlashCommand;
	});

	afterEach(() => {
		delete slashCommands.commands.topic;
	});

	it('should preserve existing description when i18nDescription is not provided', async () => {
		const bridge = new AppCommandsBridge(mockOrch);
		const appCommand = {
			command: 'topic',
			i18nParamsExample: undefined,
			i18nDescription: undefined,
			providesPreview: false,
			executor: jest.fn(),
		} as unknown as ISlashCommand;

		await (bridge as any).modifyCommand(appCommand, 'test-app-id');

		expect(slashCommands.commands.topic.description).toBe('Set the topic of the room');
	});

	it('should overwrite description when i18nDescription is provided', async () => {
		const bridge = new AppCommandsBridge(mockOrch);
		const appCommand = {
			command: 'topic',
			i18nParamsExample: undefined,
			i18nDescription: 'app_topic_description',
			providesPreview: false,
			executor: jest.fn(),
		} as unknown as ISlashCommand;

		await (bridge as any).modifyCommand(appCommand, 'test-app-id');

		expect(slashCommands.commands.topic.description).toBe('app_topic_description');
	});
});
