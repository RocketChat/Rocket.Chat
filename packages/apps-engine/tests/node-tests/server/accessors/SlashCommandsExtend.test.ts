import * as assert from 'node:assert';
import { describe, it } from 'node:test';

import type { ISlashCommand } from '../../../../src/definition/slashcommands';
import { SlashCommandsExtend } from '../../../../src/server/accessors';
import { CommandAlreadyExistsError } from '../../../../src/server/errors';
import type { AppSlashCommandManager } from '../../../../src/server/managers';

describe('SlashCommandsExtend', () => {
	it('basicSlashCommandsExtend', () => {
		assert.doesNotThrow(() => new SlashCommandsExtend({} as AppSlashCommandManager, 'testing'));
	});

	it('provideCommandToCommandsExtend', async () => {
		const commands = new Map<string, Array<ISlashCommand>>();
		const mockManager: AppSlashCommandManager = {
			addCommand(appId: string, command: ISlashCommand) {
				if (commands.has(appId)) {
					const cmds = commands.get(appId);
					if (cmds.find((v) => v.command === command.command)) {
						throw new CommandAlreadyExistsError(command.command);
					}

					cmds.push(command);
					return;
				}

				commands.set(appId, Array.from([command]));
			},
		} as AppSlashCommandManager;

		const se = new SlashCommandsExtend(mockManager, 'testing');

		const mockCommand: ISlashCommand = {
			command: 'mock',
			i18nDescription: 'Thing',
		} as ISlashCommand;

		await assert.doesNotReject(() => se.provideSlashCommand(mockCommand));
		assert.strictEqual(commands.size, 1);
		await assert.rejects(
			() => se.provideSlashCommand(mockCommand),
			{
				name: 'CommandAlreadyExists',
				message: 'The command "mock" already exists in the system.',
			},
		);
	});
});
