/**
 * Class for executing command.
 * @remarks
 * This class abstracts lower details such as interface, connection and command objects
 * from the consumers of this class.
 * Connectors can be to different call-servers. For each call server, there will be
 * a multiple interfaces. e.g in case of asterisk, there are 3 types of interfaces.
 * Asterisk Gateway Interface (AGI) : Used for dialplan administration and manipulation
 * Asterisk Rest Interface (ARI) : Used for managing asterisk resources to build own application.
 * One of the use-case of ARI is for dynamically creating endpoints or listing existing recordings.
 * Asterisk Manager Interface (AMI) : Used for querying the information from asterisk.
 *
 * We shall be using only AMI interface in the for now. Other interfaces will be
 * added as and when required.
 */

import { Commands } from './Commands';
import { IConnection } from './IConnection';
import { Logger } from '../../../../../lib/Logger';
import { CommandType } from './Command';
import { AMIConnection } from './ami/AMIConnection';
import { CommandFactory } from './ami/CommandFactory';
import { IVoipExtensionConfig, IVoipExtensionBase } from '../../../../../definition/IVoipExtension';

const version = 'Asterisk Connector 1.0';

export class CommandHandler {
	private connections: Map<CommandType, IConnection>;

	private logger: Logger | undefined;

	constructor() {
		this.logger = new Logger('CommandHandler');
		this.connections = new Map<CommandType, IConnection>();

		// Initialize available connections
		// const connection = new AMIConnection();
		const connection = new AMIConnection();
		/* TODO(Amol) : This information must come from
		 * an API/Database.
		 * Currently hardcoded. Hence commenting the code
		 */
		connection.connect('omni-asterisk.dev.rocket.chat',
			'5038',
			'amol',
			'1234');
		this.connections.set(CommandType.AMI, connection);
	}

	/* Executes |commandToExecute| on a particular command object
	 * @remarks
	 * CommandFactory is responsible for creating a |Command| object necessary
	 * for executing an AMI command. Every concrete command object inherits
	 * from class |Command|. Which overrides a method called executeCommand.
	 * This function returns a promise. Caller can wait for the promise to resolve
	 * or rejected.
	 */
	executeCommand(commandToExecute: Commands, commandData: any): Promise<IVoipExtensionConfig | IVoipExtensionBase []> {
		this.logger?.debug(`executeCommand() executing ${ Commands[commandToExecute] }`);
		const command = CommandFactory.getCommandObject(commandToExecute);
		command.connection = this.connections.get(command.type) as IConnection;
		return command.executeCommand?.(commandData);
	}

	// Get the version string
	getVersion(): string {
		return version;
	}
}
