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
import { PJSIPEndpoint } from './PJSIPEndpoint';

export class CommandFactory {
	static getCommandObject(command: Commands): Command {
		switch (command) {
			case Commands.ping:
				return new Command(Commands.ping.toString(), false);
			case Commands.extension_info:
			case Commands.extension_list:
				const commandObject = new PJSIPEndpoint(command.toString(), false);
				return commandObject;
		}
	}
}
