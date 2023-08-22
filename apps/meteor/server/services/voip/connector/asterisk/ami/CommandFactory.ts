/**
 * Factory class for creating a command specific object.
 * @remarks
 * Even though there may be multiple |Commands| object, the Command execution is
 * logically organized based on the entities on the call server.
 * e.g even though extension_info and extension_list are two different commands,
 * they will be executed by |PJSIPEndpoint| class.
 */
import { Logger } from '@rocket.chat/logger';
import type { Db } from 'mongodb';

import { Command } from '../Command';
import { Commands } from '../Commands';
import { ACDQueue } from './ACDQueue';
import { ContinuousMonitor } from './ContinuousMonitor';
import { PJSIPEndpoint } from './PJSIPEndpoint';

export class CommandFactory {
	static logger: Logger = new Logger('CommandFactory');

	static getCommandObject(command: Commands, db: Db): Command {
		this.logger.debug({ msg: `Creating command object for ${Commands[command]}` });
		switch (command) {
			case Commands.ping:
				return new Command(Commands.ping.toString(), false, db);
			case Commands.extension_info:
			case Commands.extension_list: {
				return new PJSIPEndpoint(command.toString(), false, db);
			}
			case Commands.queue_details:
			case Commands.queue_summary: {
				return new ACDQueue(command.toString(), false, db);
			}
			case Commands.event_stream: {
				return new ContinuousMonitor(command.toString(), false, db);
			}
		}
	}
}
