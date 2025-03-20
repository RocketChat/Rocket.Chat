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
import type { IVoipConnectorResult, IManagementServerConnectionStatus, IManagementConfigData } from '@rocket.chat/core-typings';
import { Logger } from '@rocket.chat/logger';
import type { Db } from 'mongodb';

import type { Command } from './Command';
import { CommandType } from './Command';
import { Commands } from './Commands';
import type { IConnection } from './IConnection';
import { getManagementServerConfig } from '../../lib/Helper';
import { WebsocketConnection } from '../websocket/WebsocketConnection';
import { AMIConnection } from './ami/AMIConnection';
import { CommandFactory } from './ami/CommandFactory';

const version = 'Asterisk Connector 1.0';

export class CommandHandler {
	private connections: Map<CommandType, IConnection>;

	private logger: Logger;

	private continuousMonitor: Command;

	private db: Db;

	constructor(db: Db) {
		this.logger = new Logger('CommandHandler');
		this.connections = new Map<CommandType, IConnection>();
		this.db = db;
	}

	async initConnection(commandType: CommandType): Promise<void> {
		// Initialize available connections
		const connection = new AMIConnection();

		const config = commandType === CommandType.AMI ? getManagementServerConfig() : undefined;
		if (!config) {
			this.logger.warn('Management server configuration not found');
			return;
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

		if (!config.host) {
			this.logger.error('Invalid host');
			return;
		}

		try {
			await connection.connect(
				config.host,
				(config.configData as IManagementConfigData).port.toString(),
				(config.configData as IManagementConfigData).username,
				(config.configData as IManagementConfigData).password,
			);
			this.connections.set(commandType, connection);
			this.continuousMonitor = CommandFactory.getCommandObject(Commands.event_stream, this.db);
			const continuousMonitor = this.connections.get(this.continuousMonitor.type);
			if (!continuousMonitor) {
				throw new Error(`No connection for ${this.continuousMonitor.type}`);
			}
			this.continuousMonitor.connection = continuousMonitor;
			this.continuousMonitor.initMonitor({});
		} catch (err: unknown) {
			this.logger.error({ msg: 'Management server connection error', err });
		}
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
		this.logger.debug({ msg: `executeCommand() executing ${Commands[commandToExecute]}` });
		const command = CommandFactory.getCommandObject(commandToExecute, this.db);
		const connection = this.connections.get(command.type) as IConnection;
		if (!connection?.isConnected()) {
			throw Error('Connection error');
		}
		command.connection = this.connections.get(command.type) as IConnection;
		return command.executeCommand(commandData);
	}

	// Get the version string
	getVersion(): string {
		return version;
	}

	async checkManagementConnection(
		host: string,
		port: string,
		userName: string,
		password: string,
	): Promise<IManagementServerConnectionStatus> {
		this.logger.debug({ msg: 'checkManagementConnection()', host, port, userName });
		const connection = new AMIConnection();
		try {
			await connection.connect(host, port, userName, password);
			if (connection.isConnected()) {
				// Just a second level of check to ensure that we are actually
				// connected and authenticated.
				connection.closeConnection();
			}
			this.logger.debug({ msg: 'checkManagementConnection() Connected ' });
			return {
				status: 'connected',
			};
		} catch (err: unknown) {
			this.logger.error({ msg: 'checkManagementConnection() Connection Error', err });
			throw err;
		}
	}

	async checkCallserverConnection(websocketUrl: string, protocol?: string): Promise<IManagementServerConnectionStatus> {
		this.logger.debug({ msg: 'checkCallserverConnection()', websocketUrl });
		const connection = new WebsocketConnection();
		try {
			await connection.connectWithUrl(websocketUrl, protocol);
			if (connection.isConnected()) {
				// Just a second level of check to ensure that we are actually
				// connected and authenticated.
				connection.closeConnection();
			}
			this.logger.debug({ msg: 'checkManagementConnection() Connected ' });
			return {
				status: 'connected',
			};
		} catch (err: unknown) {
			this.logger.error({ msg: 'checkManagementConnection() Connection Error', err });
			throw err;
		}
	}

	stop(): void {
		if (!this.continuousMonitor) {
			// service is already stopped or was never initialized
			return;
		}

		this.continuousMonitor.cleanMonitor();
		for (const connection of this.connections.values()) {
			connection.closeConnection();
		}
	}
}
