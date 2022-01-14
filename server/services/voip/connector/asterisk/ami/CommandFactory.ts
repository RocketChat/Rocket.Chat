/**
 * Factory class for creating a command specific object.
 * @remarks
 * Even though there may be multiple |Commands| object, the Command execution is
 * logically organized based on the entities on the call server.
 * e.g even though extension_info and extension_list are two different commands,
 * they will be executed by |PJSIPEndpoint| class.
 */
import { Command } from '../Command';
import { Commands } from '../Commands';
import { ACDQueue } from './ACDQueue';
import { PJSIPEndpoint } from './PJSIPEndpoint';
import { Logger } from '../../../../../lib/logger/Logger';

export class CommandFactory {
	static logger: Logger = new Logger('CommandFactory');

	static getCommandObject(command: Commands): Command {
		this.logger.debug({ msg: ' Creating command object for ${ Commands[command] }' });
		switch (command) {
			case Commands.ping:
				return new Command(Commands.ping.toString(), false);
			case Commands.extension_info:
			case Commands.extension_list: {
				return new PJSIPEndpoint(command.toString(), false);
			}
			case Commands.queue_details:
			case Commands.queue_summary: {
				return new ACDQueue(command.toString(), false);
			}
		}
	}
}
