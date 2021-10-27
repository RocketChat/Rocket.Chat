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


export class AMIConnection implements IConnection {
	connection: typeof Manager | undefined;

	eventHandlers: Map<string, any>;

	private logger: Logger;

	constructor() {
		this.logger = new Logger('AMIConnection');
		this.eventHandlers = new Map<string, CallbackContext[]>();
	}

	connect(connectionIpOrHostname: string,
		connectionPort: string,
		userName: string,
		password: string): void {
		this.logger.log({ msg: 'connect()' });
		this.connection = new Manager(connectionPort, connectionIpOrHostname, userName, password, true);
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
		 */
		this.connection.on('managerevent', this.eventHandlerCallback.bind(this));
	}

	isConnected(): boolean {
		if (this.connection) {
			return this.connection.isConnected();
		}
		return false;
	}

	// Executes an action on asterisk and returns the result.
	executeCommand(action: object, actionResultCallback: any): void {
		this.logger.info({ msg: 'executeCommand()' });
		this.connection.action(action, actionResultCallback);
	}

	eventHandlerCallback(event: any): void {
		this.logger.info({ msg: 'eventHandlerCallback()', event });
		if (!this.eventHandlers.has(event.event.toLowerCase())) {
			this.logger.info({ msg: `eventHandlerCallback() no event handler set for ${ event.event }` });
			return;
		}
		this.logger.debug({ msg: 'eventHandlerCallback() Event found', event: event.event });
		const handlers: CallbackContext[] = this.eventHandlers.get(event.event.toLowerCase());
		this.logger.debug({ msg: `eventHandlerCallback() Handler count = ${ handlers.length }` });
		/* Go thru all the available handlers  and call each one of them if the actionid matches */
		for (const handler of handlers) {
			if (handler.call(event)) {
				this.logger.debug({ msg: `eventHandlerCallback() called callback for action = ${ event.actionid }` });
			} else {
				this.logger.warn({ msg: `eventHandlerCallback() No command found for action = ${ event.actionid }` });
			}
		}
	}

	on(event: string, callbackContext: CallbackContext): void {
		this.logger.info({ msg: 'on()' });
		if (!this.eventHandlers.has(event)) {
			this.logger.debug({ msg: `on() no existing handlers for event = ${ event }` });
			const array: CallbackContext[] = [];
			this.eventHandlers.set(event, array);
		}
		this.eventHandlers.get(event)?.push(callbackContext);
	}

	off(event: string, command: Command): void {
		this.logger.info({ msg: 'off()' });
		if (!this.eventHandlers.has(event)) {
			this.logger.warn({ msg: `off() No event handler found for ${ event }` });
			return;
		}
		this.logger.debug({ msg: `off() Event found ${ event }` });
		const handlers = this.eventHandlers.get(event);
		this.logger.debug({ msg: `off() Handler array length = ${ handlers.length }` });
		for (const handler of handlers) {
			if (!handler.isValidContext(command.actionid)) {
				continue;
			}
			const newHandlers = handlers.filter((obj: any) => obj !== handler);
			if (!newHandlers.length) {
				this.logger.debug({ msg: `off() No handler for ${ event } deleting event from the map.` });
				this.eventHandlers.delete(event);
			} else {
				this.eventHandlers.set(event, newHandlers);
				break;
			}
		}
	}

	closeConnection(): void {
		this.logger.info({ msg: 'closeConnection()' });
		this.connection.disconnect();
	}
}
