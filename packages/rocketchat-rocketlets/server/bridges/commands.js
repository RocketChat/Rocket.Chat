export class RocketletCommandsBridge {
	constructor(converters) {
		this.converters = converters;
		this.disabledCommands = new Map();
	}

	doesCommandExist(command, rocketletId) {
		console.log(`The Rocketlet ${ rocketletId } is checking if "${ command }" command exists.`);

		if (typeof command !== 'string') {
			return false;
		}

		return typeof RocketChat.slashCommands.commands[command.toLowerCase()] === 'object';
	}

	disableCommand(command, rocketletId) {
		console.log(`The Rocketlet ${ rocketletId } is attempting to disable the command: "${ command }"`);

		if (typeof command !== 'string' || command.trim().length === 0) {
			throw new Error('Invalid command parameter provided, must be a string.');
		}

		const cmd = command.toLowerCase();
		if (typeof RocketChat.slashCommands.commands[cmd] === 'undefined') {
			throw new Error(`Command does not exist in the system currently (or it is disabled): ${ cmd }`);
		}

		this.disabledCommands.set(cmd, RocketChat.slashCommands.commands[cmd]);
		delete RocketChat.slashCommands.commands[cmd];

		Rocketlets.getNotifier().commandDisabled(cmd);
	}

	// command: { command, paramsExample, i18nDescription, executor: function }
	modifyCommand(command, rocketletId) {
		console.log(`The Rocketlet ${ rocketletId } is attempting to modify the command: "${ command }"`);

		this._verifyCommand(command);

		const cmd = command.toLowerCase();
		if (typeof RocketChat.slashCommands.commands[cmd] === 'undefined') {
			throw new Error(`Command does not exist in the system currently (or it is disabled): ${ cmd }`);
		}

		const item = RocketChat.slashCommands.commands[cmd];
		item.params = command.paramsExample ? command.paramsExample : item.params;
		item.description = command.i18nDescription ? command.i18nDescription : item.params;
		item.callback = this._executorWrapper(command.executor);

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

	_executorWrapper(executor) {
		return function _wrappedExecutor(command, params, message) {
			// TODO: Converters
			this.converters.get('messages').translate(message);

			executor(command);
		};
	}
}
