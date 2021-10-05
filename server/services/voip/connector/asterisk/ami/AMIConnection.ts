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


/**
 * Note : asterisk-manager does not provide any types.
 * We will have to write TS definitions to use import.
 * This shall be done in future.
 */
// eslint-disable-next-line @typescript-eslint/no-var-requires
const Manager = require('asterisk-manager');


export class AMIConnection implements IConnection {
	connection: typeof Manager | undefined;

	private logger: Logger;

	constructor() {
		this.logger = new Logger('AMIConnection');
	}

	connect(connectionIpOrHostname: string,
		connectionPort: string,
		userName: string,
		password: string): void {
		this.logger.log({ msg: 'connect()' });
		this.connection = new Manager(connectionPort, connectionIpOrHostname, userName, password, true);
	}

	isConnected(): boolean {
		if (this.connection) {
			return this.connection.isConnected();
		}
		return false;
	}

	// Executes an action on asterisk and returns the result.
	executeCommand(action: object, actionResultCallback: any): void {
		this.logger.log({ msg: 'executeCommand()' });
		this.connection.action(action, actionResultCallback);
	}

	// Event handling for
	on(event: string, callback: any): void {
		this.connection.on(event, callback);
	}

	closeConnection(): void {
		this.logger.log({ msg: 'closeConnection()' });
		this.connection.disconnect();
	}
}
