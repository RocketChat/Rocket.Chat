import * as assert from 'node:assert';
import { describe, it, mock } from 'node:test';

import type { ISlashCommand } from '../../../../src/definition/slashcommands';
import { SlashCommandsModify } from '../../../../src/server/accessors';
import type { AppSlashCommandManager } from '../../../../src/server/managers';
import { TestData } from '../../../test-data/utilities';

describe('SlashCommandsModify', () => {
	it('useSlashCommandsModify', async () => {
		const cmd = TestData.getSlashCommand();
		const mockAppId = 'testing-app';
		const mockCmdManager = {
			modifyCommand(appId: string, command: ISlashCommand): void {},
			disableCommand(appId: string, command: string): void {},
			enableCommand(appId: string, command: string): void {},
		} as AppSlashCommandManager;

		assert.doesNotThrow(() => new SlashCommandsModify(mockCmdManager, mockAppId));

		const modifySpy = mock.method(mockCmdManager, 'modifyCommand');
		const disableSpy = mock.method(mockCmdManager, 'disableCommand');
		const enableSpy = mock.method(mockCmdManager, 'enableCommand');

		const scm = new SlashCommandsModify(mockCmdManager, mockAppId);

		assert.ok((await scm.modifySlashCommand(cmd)) === undefined);
		assert.strictEqual(modifySpy.mock.calls.length, 1);
		assert.deepStrictEqual(modifySpy.mock.calls[0].arguments, [mockAppId, cmd]);
		
		assert.ok((await scm.disableSlashCommand('testing-cmd')) === undefined);
		assert.strictEqual(disableSpy.mock.calls.length, 1);
		assert.deepStrictEqual(disableSpy.mock.calls[0].arguments, [mockAppId, 'testing-cmd']);
		
		assert.ok((await scm.enableSlashCommand('testing-cmd')) === undefined);
		assert.strictEqual(enableSpy.mock.calls.length, 1);
		assert.deepStrictEqual(enableSpy.mock.calls[0].arguments, [mockAppId, 'testing-cmd']);
	});
});
