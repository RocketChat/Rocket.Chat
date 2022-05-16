/**
 * Delegate interface for SIP extension information.
 * @remarks
 * This interface is implemented by a class which is
 * interested SIP registration events.
 */

export interface ICallServerConfigData {
	websocketPort: number;
	websocketPath: string;
}
export interface IExtensionDetails {
	extension: string;
	password: string;
	authtype: string;
	state: string;
}
export interface IRegistrationInfo {
	host: string;
	callServerConfig: ICallServerConfigData;
	extensionDetails: IExtensionDetails;
}
