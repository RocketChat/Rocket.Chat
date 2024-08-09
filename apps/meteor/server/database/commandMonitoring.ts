import { Logger } from '@rocket.chat/logger';

import { client } from './utils';

const MONGO_VALID_COMMANDS = ['commandStarted', 'commandSucceeded', 'commandFailed'];

const envCommands = process.env.LOG_MONGO_COMMANDS;

(function logCommands() {
	const commands = envCommands !== '' ? envCommands?.split(',') : [];

	if (!commands?.length) {
		return;
	}

	const dbQueryLogger = new Logger('DatabaseCommands');

	commands
		.filter((command) => MONGO_VALID_COMMANDS.includes(command))
		.forEach((command) => {
			client.on(command, (event) => {
				dbQueryLogger.debug({
					command,
					event,
				});
			});
		});
})();
