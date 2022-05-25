/* eslint-disable @typescript-eslint/camelcase */
/**
 * Factory class for creating a command specific object.
 * @remarks
 * Even though there may be multiple |Commands| object, the Command execution is
 * logically organized based on the entities on the call server.
 * e.g even though extension_info and extension_list are two different commands,
 * they will be executed by |PJSIPEndpoint| class.
 */
import { Db } from 'mongodb';

import { Commands } from '../Commands';
import { ACDQueue } from './ACDQueue';
import { PJSIPEndpoint } from './PJSIPEndpoint';
import { Logger } from '../../../../../lib/logger/Logger';
import { ContinuousMonitor } from './ContinuousMonitor';
import { PingCommand } from './Ping';

export class CommandFactory {
	static logger: Logger = new Logger('CommandFactory');

	static getCommandObject(command: keyof typeof Commands, db: Db): PJSIPEndpoint | ACDQueue | ContinuousMonitor | PingCommand {
		this.logger.debug({ msg: `Creating command object for ${Commands[command]}` });
		if (command === 'ping') {
			return new PingCommand(command.toString(), false, db);
		}
		if (command === 'event_stream') {
			return new ContinuousMonitor(command.toString(), false, db);
		}
		if (command === 'extension_info' || command === 'extension_list') {
			return new PJSIPEndpoint(command.toString(), false, db);
		}
		if (command === 'queue_details' || command === 'queue_summary') {
			return new ACDQueue(command.toString(), false, db);
		}

		throw new Error(`CommandFactory: Unknown command ${command}`);
	}
}
