/* eslint-disable @typescript-eslint/no-empty-function */
/**
 * Class representing AMI connection.
 * @remarks
 * This class is based on https://github.com/pipobscure/NodeJS-AsteriskManager
 * which is internally based on https://github.com/mscdex/node-asterisk
 *
 * Asterisk AMI interface is a socket based interface. The AMI configuration
 * happens in /etc/asterisk/manager.conf file.
 *
 */
import { IConnection } from '../IConnection';
import { Logger } from '../../../../../lib/logger/Logger';
import { Command } from '../Command';
import { CallbackContext } from './CallbackContext';

/**
 * Note : asterisk-manager does not provide any types.
 * We will have to write TS definitions to use import.
 * This shall be done in future.
 */
// eslint-disable-next-line @typescript-eslint/no-var-requires
const Manager = require('asterisk-manager');

function makeLoggerDummy(logger: Logger): Logger {
	logger.log = function log(..._args: any[]): void {};
	logger.debug = function debug(..._args: any[]): void {};
	logger.info = function info(..._args: any[]): void {};
	logger.error = function error(..._args: any[]): void {};

	return logger;
}

type ConnectionState = 'UNKNOWN' | 'AUTHENTICATED' | 'ERROR';

export class AMIConnection implements IConnection {
	connection: typeof Manager | undefined;

	connectionState: ConnectionState;

	connectionIpOrHostname: string;

	connectionPort: string;

	userName: string;

	password: string;

	eventHandlers: Map<string, any>;

	private logger: Logger;

	// This class prints a ton of logs that are useful for debugging specific communication things
	// However, for most usecases, logs here won't be needed. Hardcoding while we add a setting
	// "Print extended voip connection logs" which will control classes' logging behavior
	private printLogs = false;

	totalReconnectionAttempts = 5;

	currentReconnectionAttempt = 0;

	// Starting with 5 seconds of backoff time. increases with the attempts.
	initialBackoffDurationMS = 5000;

	nearEndDisconnect = false;

	// if it is a test connection
	// Reconnectivity logic should not be applied.
	connectivityCheck = false;

	constructor() {
		const logger = new Logger('AMIConnection');
		this.logger = this.printLogs ? logger : makeLoggerDummy(logger);
		this.eventHandlers = new Map<string, CallbackContext[]>();
		this.connectionState = 'UNKNOWN';
	}

	cleanup(): void {
		if (!this.connection) {
			return;
		}
		this.connection.removeAllListeners();
		this.connection = null;
	}

	reconnect(): void {
		this.logger.debug({
			msg: 'reconnect ()',
			initialBackoffDurationMS: this.initialBackoffDurationMS,
			currentReconnectionAttempt: this.currentReconnectionAttempt,
		});
		if (this.currentReconnectionAttempt === this.totalReconnectionAttempts) {
			this.logger.info({ msg: 'reconnect () Not attempting to reconnect' });
			// We have exhausted the reconnection attempts or we have authentication error
			// We dont want to retry anymore
			this.connectionState = 'ERROR';
			return;
		}
		const backoffTime = this.initialBackoffDurationMS + this.initialBackoffDurationMS * this.currentReconnectionAttempt;
		setTimeout(async () => {
			try {
				await this.attemptConnection();
			} catch (error: unknown) {
				this.logger.error({ msg: 'reconnect () attemptConnection() has thrown error', error });
			}
		}, backoffTime);
		this.currentReconnectionAttempt += 1;
	}

	onManagerError(reject: any, error: unknown): void {
		this.logger.error({ msg: 'onManagerError () Connection Error', error });
		this.cleanup();
		this.connectionState = 'ERROR';
		if (this.currentReconnectionAttempt === this.totalReconnectionAttempts) {
			this.logger.error({ msg: 'onManagerError () reconnection attempts exhausted. Please check connection settings' });
			reject(error);
		} else {
			this.reconnect();
		}
	}

	onManagerConnect(_resolve: any, _reject: any): void {
		this.logger.debug({ msg: 'onManagerConnect () Connection Success' });
		this.connection.login(this.onManagerLogin.bind(this, _resolve, _reject));
	}

	onManagerLogin(resolve: any, reject: any, error: unknown): void {
		if (error) {
			this.logger.error({ msg: 'onManagerLogin () Authentication Error. Not going to reattempt. Fix the credentaials' });
			// Do not reattempt if we have login failure
			this.cleanup();
			reject(error);
		} else {
			this.connectionState = 'AUTHENTICATED';
			this.currentReconnectionAttempt = 0;
			/**
			 * Note : There is no way to release a handler or cleanup the handlers.
			 * Handlers are released only when the connection is closed.
			 * Closing the connection and establishing it again for every command is an overhead.
			 * To avoid that, we have taken a clean, though a bit complex approach.
			 * We will register for all the manager event.
			 *
			 * Each command will register to AMIConnection to receive the events which it is
			 * interested in. Once the processing is complete, it will unregister.
			 *
			 * Handled in this way will avoid disconnection of the connection to cleanup the
			 * handlers.
			 *
			 * Furthermore, we do not want to initiate this when we are checking
			 * the connectivity.
			 */
			if (!this.connectivityCheck) {
				this.connection.on('managerevent', this.eventHandlerCallback.bind(this));
			}
			this.logger.debug({ msg: 'onManagerLogin () Authentication Success, Connected' });
			resolve();
		}
	}

	onManagerClose(hadError: unknown): void {
		this.logger.error({ msg: 'onManagerClose ()', hadError });
		this.cleanup();
		if (!this.nearEndDisconnect) {
			this.reconnect();
		}
	}

	onManagerTimeout(): void {
		this.logger.debug({ msg: 'onManagerTimeout ()' });
		this.cleanup();
	}

	async attemptConnection(): Promise<void> {
		this.connectionState = 'UNKNOWN';
		this.connection = new Manager(undefined, this.connectionIpOrHostname, this.userName, this.password, true);

		const returnPromise = new Promise<void>((_resolve, _reject) => {
			this.connection.on('connect', this.onManagerConnect.bind(this, _resolve, _reject));
			this.connection.on('error', this.onManagerError.bind(this, _reject));

			this.connection.on('close', this.onManagerClose.bind(this));
			this.connection.on('timeout', this.onManagerTimeout.bind(this));

			this.connection.connect(this.connectionPort, this.connectionIpOrHostname);
		});
		return returnPromise;
	}

	/**
	 * connect: Connects to asterisk
	 * description: This function initiates a connection to asterisk management interface
	 * for receiving the various events. These events could be a result of action command sent over
	 * the socket or an events that asterisk sents over this connection. In the later case, what asterisk
	 * sends over the socket depends on the way permissions are given to the user in asterisk's
	 * manager.conf file.
	 * This code uses a lib https://github.com/pipobscure/NodeJS-AsteriskManager
	 * The working of this library actually connects in the object creation. i.e
	 * new Manager(port, connectionIpOrHostname, userName, password, true);
	 * So it was noticed that if we call isConnected immediately after creating the object,
	 * it returns false. Eventualy when the connection  and authentication succeeds
	 * it will be set back to true.
	 * To avoid this connection we have to explicitly create the Manager with undefined port value.
	 * When done so, We will have to explicitly call connect and login functions.
	 * These functions can give a callback where we can resolve the promises
	 * This way it ensures that the rocket.chat service has a valid connection or an error when this function
	 * call is over.
	 *
	 * @param connectionIpOrHostname
	 * @param connectionPort
	 * @param userName
	 * @param password
	 */
	async connect(
		connectionIpOrHostname: string,
		connectionPort: string,
		userName: string,
		password: string,
		connectivityCheck = false,
	): Promise<void> {
		this.logger.log({ msg: 'connect()' });
		this.connectionIpOrHostname = connectionIpOrHostname;
		this.connectionPort = connectionPort;
		this.userName = userName;
		this.password = password;
		this.connectivityCheck = connectivityCheck;
		await this.attemptConnection();
	}

	isConnected(): boolean {
		if (this.connection) {
			return this.connection.isConnected();
		}
		return false;
	}

	// Executes an action on asterisk and returns the result.
	executeCommand(action: object, actionResultCallback: any): void {
		if (this.connectionState !== 'AUTHENTICATED' || (this.connection && !this.connection.isConnected())) {
			this.logger.warn({ msg: 'executeCommand() Cant execute command at this moment. Connection is not active' });
			throw Error('Cant execute command at this moment. Connection is not active');
		}
		this.logger.info({ msg: 'executeCommand()' });
		this.connection.action(action, actionResultCallback);
	}

	eventHandlerCallback(event: any): void {
		if (!this.eventHandlers.has(event.event.toLowerCase())) {
			this.logger.info({ msg: `No event handler set for ${event.event}` });
			return;
		}
		const handlers: CallbackContext[] = this.eventHandlers.get(event.event.toLowerCase());
		this.logger.debug({ msg: `eventHandlerCallback() Handler count = ${handlers.length}` });
		/* Go thru all the available handlers  and call each one of them if the actionid matches */
		for (const handler of handlers) {
			if (handler.call(event)) {
				this.logger.debug({ msg: `eventHandlerCallback() called callback for action = ${event.actionid}` });
			} else {
				this.logger.debug({
					msg: `eventHandlerCallback() No command found for action = ${event.actionid}`,
					event: event.event,
				});
			}
		}
	}

	on(event: string, callbackContext: CallbackContext): void {
		this.logger.info({ msg: 'on()' });
		if (!this.eventHandlers.has(event)) {
			this.logger.debug({ msg: `on() no existing handlers for event = ${event}` });
			const array: CallbackContext[] = [];
			this.eventHandlers.set(event, array);
		}
		this.eventHandlers.get(event)?.push(callbackContext);
	}

	off(event: string, command: Command): void {
		this.logger.info({ msg: 'off()' });
		if (!this.eventHandlers.has(event)) {
			this.logger.warn({ msg: `off() No event handler found for ${event}` });
			return;
		}
		this.logger.debug({ msg: `off() Event found ${event}` });
		const handlers = this.eventHandlers.get(event);
		this.logger.debug({ msg: `off() Handler array length = ${handlers.length}` });
		for (const handler of handlers) {
			if (!handler.isValidContext(command.actionid)) {
				continue;
			}
			const newHandlers = handlers.filter((obj: any) => obj !== handler);
			if (!newHandlers.length) {
				this.logger.debug({ msg: `off() No handler for ${event} deleting event from the map.` });
				this.eventHandlers.delete(event);
			} else {
				this.eventHandlers.set(event, newHandlers);
				break;
			}
		}
	}

	closeConnection(): void {
		this.logger.info({ msg: 'closeConnection()' });
		this.nearEndDisconnect = true;
		this.connection.disconnect();
		this.cleanup();
	}
}
