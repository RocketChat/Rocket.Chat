import { Command } from './Command';
import { ICallbackContext } from './ICallbackContext';
/**
 * Delegate interface for Asterisk management connection.
 * @remarks
 * This interface will be implemented by all those classes which are
 * interested in connecting to asterisk via different ways such as AMI, ARI and AGI
 *
 * */
export interface IConnection {
	/**
	 * Called for conneting to the server
	 * @remarks
	 * Callback for handling incoming call
	 */
	connect?(connectionIpOrHostname: string, connectionPort: string, userName: string, password: string): Promise<void>;

	/**
	 * Called for conneting to the server
	 * @remarks
	 * Callback for handling incoming call
	 */
	connectWithUrl?(connectionUrl: string, connectionProtocol?: string): Promise<void>;
	/**
	 * Called for executing the command to the connection
	 * @remarks
	 */
	executeCommand(action: object, actionResultCallback: any): void;

	/**
	 * Called for setting up event handling
	 * @remarks
	 */
	on(event: string, callbackContext: ICallbackContext): void;

	/**
	 * Called for resetting all event handlers
	 * @remarks
	 */
	off(event: string, command: Command): void;
	/**
	 * Called for closing the connection.
	 * @remarks
	 */
	closeConnection(): void;

	/**
	 * Called for checking if connected
	 * @remarks
	 */
	isConnected(): boolean;
}
