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
import { Logger } from '../../../../lib/logger/Logger';
import { CommandType } from './Command';
import { AMIConnection } from './ami/AMIConnection';
import { CommandFactory } from './ami/CommandFactory';
import { IVoipConnectorResult } from '../../../../../definition/IVoipConnectorResult';
import { IVoipService } from '../../../../sdk/types/IVoipService';
import { IManagementConfigData, IVoipServerConfig, ServerType } from '../../../../../definition/IVoipServerConfig';

const version = 'Asterisk Connector 1.0';

export class CommandHandler {
	private connections: Map<CommandType, IConnection>;

	private service: IVoipService;

	private logger: Logger;

	constructor(service: IVoipService) {
		this.logger = new Logger('CommandHandler');
		this.connections = new Map<CommandType, IConnection>();
		this.service = service;
	}

	async initConnection(commandType: CommandType): Promise<void> {
		// Initialize available connections
		// const connection = new AMIConnection();
		const connection = new AMIConnection();
		let config: IVoipServerConfig | null = null;
		if (commandType === CommandType.AMI) {
			config = await this.service.getServerConfigData(ServerType.MANAGEMENT);
		}
		if (!config) {
			this.logger.warn('Management server configuration not found');
			throw Error('Management server configuration not found');
		}
		/**
		 * If we have the same type of connection already established, close it
		 * and remove it from the map.
		 */
		if (this.connections.get(commandType)?.isConnected()) {
			this.logger.error({ msg: 'connection exists. Closing the connection.' });
			this.connections.get(commandType)?.closeConnection();
			this.connections.delete(commandType);
		}
		connection.connect(config.host,
			(config.configData as IManagementConfigData).port.toString(),
			(config.configData as IManagementConfigData).username,
			(config.configData as IManagementConfigData).password,
		);
		this.connections.set(commandType, connection);
	}

	/* Executes |commandToExecute| on a particular command object
	 * @remarks
	 * CommandFactory is responsible for creating a |Command| object necessary
	 * for executing an AMI command. Every concrete command object inherits
	 * from class |Command|. Which overrides a method called executeCommand.
	 * This function returns a promise. Caller can wait for the promise to resolve
	 * or rejected.
	 */
	executeCommand(commandToExecute: Commands, commandData?: any): Promise<IVoipConnectorResult> {
		this.logger.debug({ msg: `executeCommand() executing ${ Commands[commandToExecute] }` });
		const command = CommandFactory.getCommandObject(commandToExecute);
		command.connection = this.connections.get(command.type) as IConnection;
		return command.executeCommand(commandData);
	}

	// Get the version string
	getVersion(): string {
		return version;
	}
}
