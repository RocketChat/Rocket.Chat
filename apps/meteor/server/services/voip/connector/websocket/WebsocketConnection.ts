/**
 * Class representing Websocket connection.
 * @remarks
 *
 * This class wraps around websocket with asterisk. WebSocket protocol is defaulted to sip
 * for connection but can be passed externally.
 *
 * Websocket configurations can be found in asterisk's http.conf and pjsip.conf
 *
 */
import WebSocket from 'ws';

import type { IConnection } from '../asterisk/IConnection';
import { Logger } from '../../../../lib/logger/Logger';
import type { Command } from '../asterisk/Command';
import type { CallbackContext } from '../asterisk/ami/CallbackContext';

export class WebsocketConnection implements IConnection {
	connection: WebSocket;

	private logger: Logger;

	constructor() {
		this.logger = new Logger('WebsocketConnection');
	}

	connectWithUrl(connectionUrl: string, connectionProtocol = 'sip'): Promise<void> {
		this.logger.log({ msg: 'connect()' });
		const returnPromise = new Promise<void>((_resolve, _reject) => {
			const onError = (error: any): void => {
				_reject(error);
				this.logger.error({ msg: 'checkCallserverConnection () Connection Error', error });
			};
			const onConnect = (): void => {
				_resolve();
				this.connection.close();
			};
			this.connection = new WebSocket(connectionUrl, connectionProtocol);
			this.connection.on('open', onConnect);
			this.connection.on('error', onError);
		});
		return returnPromise;
	}

	isConnected(): boolean {
		this.logger.debug({ msg: 'isConnected() unimplemented' });
		return false;
	}

	// Executes an action on asterisk and returns the result.
	executeCommand(_action: object, _actionResultCallback: any): void {
		this.logger.debug({ msg: 'executeCommand() unimplemented' });
	}

	on(_event: string, _callbackContext: CallbackContext): void {
		this.logger.debug({ msg: 'on() unimplemented' });
	}

	off(_event: string, _command: Command): void {
		this.logger.debug({ msg: 'on() unimplemented' });
	}

	closeConnection(): void {
		this.logger.info({ msg: 'closeConnection()' });
		this.connection.close();
	}
}
