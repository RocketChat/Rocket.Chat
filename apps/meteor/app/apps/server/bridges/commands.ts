import { Meteor } from 'meteor/meteor';
import { SlashCommandContext, ISlashCommand, ISlashCommandPreviewItem } from '@rocket.chat/apps-engine/definition/slashcommands';
import { CommandBridge } from '@rocket.chat/apps-engine/server/bridges/CommandBridge';
import type { IMessage, RequiredField, SlashCommand } from '@rocket.chat/core-typings';

import { slashCommands } from '../../../utils/server';
import { Utilities } from '../../lib/misc/Utilities';
import { AppServerOrchestrator } from '../orchestrator';
import { parseParameters } from '../../../../lib/utils/parseParameters';

export class AppCommandsBridge extends CommandBridge {
	disabledCommands: Map<string, typeof slashCommands.commands[string]>;

	// eslint-disable-next-line no-empty-function
	constructor(private readonly orch: AppServerOrchestrator) {
		super();
		this.disabledCommands = new Map();
	}

	protected doesCommandExist(command: string, appId: string): boolean {
		this.orch.debugLog(`The App ${appId} is checking if "${command}" command exists.`);

		if (typeof command !== 'string' || command.length === 0) {
			return false;
		}

		const cmd = command.toLowerCase();

		return typeof slashCommands.commands[cmd] === 'object' || this.disabledCommands.has(cmd);
	}

	protected enableCommand(command: string, appId: string): void {
		this.orch.debugLog(`The App ${appId} is attempting to enable the command: "${command}"`);

		if (typeof command !== 'string' || command.trim().length === 0) {
			throw new Error('Invalid command parameter provided, must be a string.');
		}

		const cmd = command.toLowerCase();
		if (!this.disabledCommands.has(cmd)) {
			throw new Error(`The command is not currently disabled: "${cmd}"`);
		}

		slashCommands.commands[cmd] = this.disabledCommands.get(cmd) as typeof slashCommands.commands[string];
		this.disabledCommands.delete(cmd);

		this.orch.getNotifier().commandUpdated(cmd);
	}

	protected disableCommand(command: string, appId: string): void {
		this.orch.debugLog(`The App ${appId} is attempting to disable the command: "${command}"`);

		if (typeof command !== 'string' || command.trim().length === 0) {
			throw new Error('Invalid command parameter provided, must be a string.');
		}

		const cmd = command.toLowerCase();
		if (this.disabledCommands.has(cmd)) {
			// The command is already disabled, no need to disable it yet again
			return;
		}

		const commandObj = slashCommands.commands[cmd];

		if (typeof commandObj === 'undefined') {
			throw new Error(`Command does not exist in the system currently: "${cmd}"`);
		}

		this.disabledCommands.set(cmd, commandObj);
		delete slashCommands.commands[cmd];

		this.orch.getNotifier().commandDisabled(cmd);
	}

	// command: { command, paramsExample, i18nDescription, executor: function }
	protected modifyCommand(command: ISlashCommand, appId: string): void {
		this.orch.debugLog(`The App ${appId} is attempting to modify the command: "${command}"`);

		this._verifyCommand(command);

		const cmd = command.command.toLowerCase();
		if (typeof slashCommands.commands[cmd] === 'undefined') {
			throw new Error(`Command does not exist in the system currently (or it is disabled): "${cmd}"`);
		}

		const item = slashCommands.commands[cmd];

		item.params = command.i18nParamsExample ? command.i18nParamsExample : item.params;
		item.description = command.i18nDescription ? command.i18nDescription : item.params;
		item.callback = this._appCommandExecutor.bind(this);
		item.providesPreview = command.providesPreview;
		item.previewer = command.previewer ? this._appCommandPreviewer.bind(this) : item.previewer;
		item.previewCallback = (
			command.executePreviewItem ? this._appCommandPreviewExecutor.bind(this) : item.previewCallback
		) as typeof slashCommands.commands[string]['previewCallback'];

		slashCommands.commands[cmd] = item;
		this.orch.getNotifier().commandUpdated(cmd);
	}

	protected registerCommand(command: ISlashCommand, appId: string): void {
		this.orch.debugLog(`The App ${appId} is registering the command: "${command.command}"`);

		this._verifyCommand(command);

		const item = {
			appId,
			command: command.command.toLowerCase(),
			params: Utilities.getI18nKeyForApp(command.i18nParamsExample, appId),
			description: Utilities.getI18nKeyForApp(command.i18nDescription, appId),
			permission: command.permission,
			callback: this._appCommandExecutor.bind(this),
			providesPreview: command.providesPreview,
			previewer: !command.previewer ? undefined : this._appCommandPreviewer.bind(this),
			previewCallback: (!command.executePreviewItem ? undefined : this._appCommandPreviewExecutor.bind(this)) as
				| typeof slashCommands.commands[string]['previewCallback']
				| undefined,
		} as SlashCommand;

		slashCommands.commands[command.command.toLowerCase()] = item;
		this.orch.getNotifier().commandAdded(command.command.toLowerCase());
	}

	protected unregisterCommand(command: string, appId: string): void {
		this.orch.debugLog(`The App ${appId} is unregistering the command: "${command}"`);

		if (typeof command !== 'string' || command.trim().length === 0) {
			throw new Error('Invalid command parameter provided, must be a string.');
		}

		const cmd = command.toLowerCase();
		this.disabledCommands.delete(cmd);
		delete slashCommands.commands[cmd];

		this.orch.getNotifier().commandRemoved(cmd);
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

	private _appCommandExecutor(
		command: string,
		parameters: any,
		message: RequiredField<Partial<IMessage>, 'rid'>,
		triggerId?: string,
	): void {
		const user = this.orch.getConverters()?.get('users').convertById(Meteor.userId());
		const room = this.orch.getConverters()?.get('rooms').convertById(message.rid);
		const threadId = message.tmid;
		const params = parseParameters(parameters);

		const context = new SlashCommandContext(
			Object.freeze(user),
			Object.freeze(room),
			Object.freeze(params) as string[],
			threadId,
			triggerId,
		);

		Promise.await(this.orch.getManager()?.getCommandManager().executeCommand(command, context));
	}

	private _appCommandPreviewer(command: string, parameters: any, message: IMessage): any {
		const user = this.orch.getConverters()?.get('users').convertById(Meteor.userId());
		const room = this.orch.getConverters()?.get('rooms').convertById(message.rid);
		const threadId = message.tmid;
		const params = parseParameters(parameters);

		const context = new SlashCommandContext(Object.freeze(user), Object.freeze(room), Object.freeze(params) as string[], threadId);
		return Promise.await(this.orch.getManager()?.getCommandManager().getPreviews(command, context));
	}

	private async _appCommandPreviewExecutor(
		command: string,
		parameters: any,
		message: IMessage,
		preview: ISlashCommandPreviewItem,
		triggerId: string,
	): Promise<void> {
		const user = this.orch.getConverters()?.get('users').convertById(Meteor.userId());
		const room = this.orch.getConverters()?.get('rooms').convertById(message.rid);
		const threadId = message.tmid;
		const params = parseParameters(parameters);

		const context = new SlashCommandContext(
			Object.freeze(user),
			Object.freeze(room),
			Object.freeze(params) as string[],
			threadId,
			triggerId,
		);

		await this.orch.getManager()?.getCommandManager().executePreview(command, preview, context);
	}
}
