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
import { Logger, LogLevel } from '../../../../../../lib/Logger';


// eslint-disable-next-line @typescript-eslint/no-var-requires
const Manager = require('asterisk-manager');


export class AMIConnection implements IConnection {
	connection: typeof Manager | undefined;

	protected logger: Logger | undefined;

	constructor() {
		this.logger = new Logger('AMIConnection');
		this.logger.setLogLevel(LogLevel.verbose);
	}

	connect(connectionIpOrHostname: string,
		connectionPort: string,
		userName: string,
		password: string): void {
		this.connection = new Manager(connectionPort, connectionIpOrHostname, userName, password, true);
	}

	isConnected(): boolean {
		if (this.connection) {
			return this.connection.isConnected();
		}
		return false;
	}

	// Executes an action on asterisk and returns the result.
	executeCommand?(action: object, actionResultCallback: any): void {
		this.connection.action(action, actionResultCallback);
	}

	// Event handling for
	on(event: string, callback: any): void {
		this.connection.on(event, callback);
	}
}
