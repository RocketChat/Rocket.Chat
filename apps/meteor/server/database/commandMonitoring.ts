import { Logger } from '@rocket.chat/logger';

import { client } from './utils';

const MONGO_VALID_COMMANDS = ['commandStarted', 'commandSucceeded', 'commandFailed'];

const envCommands = process.env.LOG_MONGO_COMMANDS;
const commands = envCommands !== '' ? envCommands?.split(',') : [];

const dbQueryLogger = new Logger('DatabaseCommands');

commands?.forEach((command) => {
	if (!MONGO_VALID_COMMANDS.includes(command)) {
		return;
	}

	client.on(command, (event) => {
		dbQueryLogger.debug({
			command,
			event,
		});
	});
});
