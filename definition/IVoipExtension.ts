import { ICallServerConfigData } from './IVoipServerConfig';

export enum EndpointState {
	UNKNOWN = 'unknown',
	REGISTERED = 'registered',
	UNREGISTERED = 'unregistered'
}
export interface IVoipExtensionBase {
	extension: string;
	state: EndpointState;
}
export interface IVoipExtensionConfig extends IVoipExtensionBase{
	authType: string;
	password: string;
}

export interface IQueueMembershipDetails {
	extension: string;
	queueCount: number;
	callWaitingCount: number;
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
