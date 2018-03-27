import { SlashCommandContext } from '@rocket.chat/apps-ts-definition/slashcommands';

export class AppCommandsBridge {
	constructor(orch) {
		this.orch = orch;
		this.disabledCommands = new Map();
	}

	doesCommandExist(command, appId) {
		console.log(`The App ${ appId } is checking if "${ command }" command exists.`);

		if (typeof command !== 'string' || command.length === 0) {
			return false;
		}

		const cmd = command.toLowerCase();
		return typeof RocketChat.slashCommands.commands[cmd] === 'object' || this.disabledCommands.has(cmd);
	}

	enableCommand(command, appId) {
		console.log(`The App ${ appId } is attempting to enable the command: "${ command }"`);

		if (typeof command !== 'string' || command.trim().length === 0) {
			throw new Error('Invalid command parameter provided, must be a string.');
		}

		const cmd = command.toLowerCase();
		if (!this.disabledCommands.has(cmd)) {
			throw new Error(`The command is not currently disabled: "${ cmd }"`);
		}

		RocketChat.slashCommands.commands[cmd] = this.disabledCommands.get(cmd);
		this.disabledCommands.delete(cmd);

		this.orch.getNotifier().commandUpdated(cmd);
	}

	disableCommand(command, appId) {
		console.log(`The App ${ appId } is attempting to disable the command: "${ command }"`);

		if (typeof command !== 'string' || command.trim().length === 0) {
			throw new Error('Invalid command parameter provided, must be a string.');
		}

		const cmd = command.toLowerCase();
		if (this.disabledCommands.has(cmd)) {
			// The command is already disabled, no need to disable it yet again
			return;
		}

		if (typeof RocketChat.slashCommands.commands[cmd] === 'undefined') {
			throw new Error(`Command does not exist in the system currently: "${ cmd }"`);
		}

		this.disabledCommands.set(cmd, RocketChat.slashCommands.commands[cmd]);
		delete RocketChat.slashCommands.commands[cmd];

		this.orch.getNotifier().commandDisabled(cmd);
	}

	// command: { command, paramsExample, i18nDescription, executor: function }
	modifyCommand(command, appId) {
		console.log(`The App ${ appId } is attempting to modify the command: "${ command }"`);

		this._verifyCommand(command);

		const cmd = command.toLowerCase();
		if (typeof RocketChat.slashCommands.commands[cmd] === 'undefined') {
			throw new Error(`Command does not exist in the system currently (or it is disabled): "${ cmd }"`);
		}

		const item = RocketChat.slashCommands.commands[cmd];
		item.params = command.paramsExample ? command.paramsExample : item.params;
		item.description = command.i18nDescription ? command.i18nDescription : item.params;
		item.callback = this._appCommandExecutor.bind(this);

		RocketChat.slashCommands.commands[cmd] = item;
		this.orch.getNotifier().commandUpdated(cmd);
	}

	registerCommand(command, appId) {
		console.log(`The App ${ appId } is registering the command: "${ command.command }"`);

		this._verifyCommand(command);

		const item = {
			command: command.command.toLowerCase(),
			params: command.paramsExample,
			description: command.i18nDescription,
			callback: this._appCommandExecutor.bind(this)
		};

		RocketChat.slashCommands.commands[command.command.toLowerCase()] = item;
		this.orch.getNotifier().commandAdded(command.command.toLowerCase());
	}

	unregisterCommand(command, appId) {
		console.log(`The App ${ appId } is unregistering the command: "${ command }"`);

		if (typeof command !== 'string' || command.trim().length === 0) {
			throw new Error('Invalid command parameter provided, must be a string.');
		}

		const cmd = command.toLowerCase();
		this.disabledCommands.delete(cmd);
		delete RocketChat.slashCommands.commands[cmd];

		this.orch.getNotifier().commandRemoved(cmd);
	}

	_verifyCommand(command) {
		if (typeof command !== 'object') {
			throw new Error('Invalid Slash Command parameter provided, it must be a valid ISlashCommand object.');
		}

		if (typeof command.command !== 'string') {
			throw new Error('Invalid Slash Command parameter provided, it must be a valid ISlashCommand object.');
		}

		if (command.paramsExample && typeof command.paramsExample !== 'string') {
			throw new Error('Invalid Slash Command parameter provided, it must be a valid ISlashCommand object.');
		}

		if (command.i18nDescription && typeof command.i18nDescription !== 'string') {
			throw new Error('Invalid Slash Command parameter provided, it must be a valid ISlashCommand object.');
		}

		if (typeof command.executor !== 'function') {
			throw new Error('Invalid Slash Command parameter provided, it must be a valid ISlashCommand object.');
		}
	}

	_appCommandExecutor(command, parameters, message) {
		const user = this.orch.getConverters().get('users').convertById(Meteor.userId());
		const room = this.orch.getConverters().get('rooms').convertById(message.rid);
		const params = parameters.length === 0 || parameters === ' ' ? [] : parameters.split(' ');

		const context = new SlashCommandContext(Object.freeze(user), Object.freeze(room), Object.freeze(params));
		this.orch.getManager().getCommandManager().executeCommand(command, context);
	}
}
