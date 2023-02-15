import type { ISlashCommand } from '@rocket.chat/apps-engine/definition/slashcommands';
import { CommandBridge } from '@rocket.chat/apps-engine/server/bridges/CommandBridge';
import type { SlashCommand } from '@rocket.chat/core-typings';
import { SlashCommandService } from '@rocket.chat/core-services';

import { Utilities } from '../../../../app/apps/lib/misc/Utilities';
import type { AppServerOrchestrator } from '../orchestrator';
import { AppEvents } from '../../../../app/apps/server/communication';

export class AppCommandsBridge extends CommandBridge {
	disabledCommands: Map<string, SlashCommand>;

	constructor(private readonly orch: AppServerOrchestrator) {
		super();
		this.disabledCommands = new Map();
	}

	protected async doesCommandExist(command: string, appId: string): Promise<boolean> {
		this.orch.debugLog(`The App ${appId} is checking if "${command}" command exists.`);

		if (typeof command !== 'string' || command.length === 0) {
			return false;
		}

		const cmd = command.toLowerCase();

		return typeof (await SlashCommandService.getCommand(cmd)) === 'object' || this.disabledCommands.has(cmd);
	}

	protected async enableCommand(command: string, appId: string): Promise<void> {
		this.orch.debugLog(`The App ${appId} is attempting to enable the command: "${command}"`);

		if (typeof command !== 'string' || command.trim().length === 0) {
			throw new Error('Invalid command parameter provided, must be a string.');
		}

		const cmd = command.toLowerCase();
		if (!this.disabledCommands.has(cmd)) {
			throw new Error(`The command is not currently disabled: "${cmd}"`);
		}

		await SlashCommandService.setAppCommand(this.disabledCommands.get(cmd) as SlashCommand);
		this.disabledCommands.delete(cmd);

		this.orch.notifyAppEvent(AppEvents.COMMAND_UPDATED, cmd);
	}

	protected async disableCommand(command: string, appId: string): Promise<void> {
		this.orch.debugLog(`The App ${appId} is attempting to disable the command: "${command}"`);

		if (typeof command !== 'string' || command.trim().length === 0) {
			throw new Error('Invalid command parameter provided, must be a string.');
		}

		const cmd = command.toLowerCase();
		if (this.disabledCommands.has(cmd)) {
			// The command is already disabled, no need to disable it yet again
			return;
		}

		const commandObj = await SlashCommandService.getCommand(cmd);

		if (typeof commandObj === 'undefined') {
			throw new Error(`Command does not exist in the system currently: "${cmd}"`);
		}

		this.disabledCommands.set(cmd, commandObj);
		await SlashCommandService.removeCommand(cmd);

		this.orch.notifyAppEvent(AppEvents.COMMAND_DISABLED, cmd);
	}

	// command: { command, paramsExample, i18nDescription, executor: function }
	protected async modifyCommand(command: ISlashCommand, appId: string): Promise<void> {
		this.orch.debugLog(`The App ${appId} is attempting to modify the command: "${command}"`);

		this._verifyCommand(command);

		const cmd = command.command.toLowerCase();
		const item = await SlashCommandService.getCommand(cmd);
		const typeofCommand = typeof item;

		if (typeofCommand === 'undefined') {
			throw new Error(`Command does not exist in the system currently (or it is disabled): "${cmd}"`);
		}

		item.params = command.i18nParamsExample ? command.i18nParamsExample : item.params;
		item.description = command.i18nDescription ? command.i18nDescription : item.params;
		item.providesPreview = command.providesPreview;
		item.previewer = !command.previewer ? undefined : ({} as any);
		item.previewCallback = !command.executePreviewItem ? undefined : ({} as any);
		await SlashCommandService.setAppCommand(item);

		this.orch.notifyAppEvent(AppEvents.COMMAND_UPDATED, cmd);
	}

	protected async registerCommand(command: ISlashCommand, appId: string): Promise<void> {
		this.orch.debugLog(`The App ${appId} is registering the command: "${command.command}"`);

		this._verifyCommand(command);

		const item = {
			appId,
			command: command.command.toLowerCase(),
			params: Utilities.getI18nKeyForApp(command.i18nParamsExample, appId),
			description: Utilities.getI18nKeyForApp(command.i18nDescription, appId),
			permission: command.permission,
			providesPreview: command.providesPreview,
			previewer: !command.previewer ? undefined : {},
			previewCallback: !command.executePreviewItem ? undefined : {},
		} as SlashCommand;

		await SlashCommandService.setAppCommand(item);
		this.orch.notifyAppEvent(AppEvents.COMMAND_ADDED, command.command.toLowerCase());
	}

	protected async unregisterCommand(command: string, appId: string): Promise<void> {
		this.orch.debugLog(`The App ${appId} is unregistering the command: "${command}"`);

		if (typeof command !== 'string' || command.trim().length === 0) {
			throw new Error('Invalid command parameter provided, must be a string.');
		}

		const cmd = command.toLowerCase();
		this.disabledCommands.delete(cmd);
		await SlashCommandService.removeCommand(cmd);

		this.orch.notifyAppEvent(AppEvents.COMMAND_REMOVED, cmd);
	}

	private _verifyCommand(command: ISlashCommand): void {
		if (typeof command !== 'object') {
			throw new Error('Invalid Slash Command parameter provided, it must be a valid ISlashCommand object.');
		}

		if (typeof command.command !== 'string') {
			throw new Error('Invalid Slash Command parameter provided, it must be a valid ISlashCommand object.');
		}

		if (command.i18nParamsExample && typeof command.i18nParamsExample !== 'string') {
			throw new Error('Invalid Slash Command parameter provided, it must be a valid ISlashCommand object.');
		}

		if (command.i18nDescription && typeof command.i18nDescription !== 'string') {
			throw new Error('Invalid Slash Command parameter provided, it must be a valid ISlashCommand object.');
		}

		if (typeof command.providesPreview !== 'boolean') {
			throw new Error('Invalid Slash Command parameter provided, it must be a valid ISlashCommand object.');
		}

		if (typeof command.executor !== 'function') {
			throw new Error('Invalid Slash Command parameter provided, it must be a valid ISlashCommand object.');
		}
	}
}
