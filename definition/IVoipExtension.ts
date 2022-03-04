import { IQueueSummary } from './ACDQueues';
import { IUser } from './IUser';
import { ICallServerConfigData } from './IVoipServerConfig';

export enum EndpointState {
	UNKNOWN = 'unknown',
	REGISTERED = 'registered',
	UNREGISTERED = 'unregistered',
	RINGING = 'ringing',
	BUSY = 'busy',
}
export interface IVoipExtensionBase {
	extension: string;
	state: EndpointState;
}

export interface IVoipExtensionWithAgentInfo extends IVoipExtensionBase {
	queues?: string[];
	userId?: IUser['_id'];
	username?: IUser['username'];
	name?: IUser['name'];
}

export const isIVoipExtensionBase = (obj: any): obj is IVoipExtensionBase =>
	obj && typeof obj.name === 'string' && typeof obj.state === 'string';

export interface IVoipExtensionConfig extends IVoipExtensionBase {
	authType: string;
	password: string;
}

export const isIVoipExtensionConfig = (obj: any): obj is IVoipExtensionConfig =>
	obj.name !== undefined && obj.state !== undefined && obj.authType !== undefined && obj.password !== undefined;

export interface IQueueMembershipDetails {
	extension: string;
	queueCount: number;
	callWaitingCount: number;
}

export interface IQueueMembershipSubscription {
	queues: IQueueSummary[];
	extension: string;
}

export const isIQueueMembershipDetails = (obj: any): obj is IQueueMembershipDetails =>
	obj && typeof obj.extension === 'string' && typeof obj.queueCount === 'number' && typeof obj.callWaitingCount === 'number';
export interface IExtensionDetails {
	extension: string;
	password: string;
	authtype: string;
	state: string;
}

export const isIExtensionDetails = (prop: any): prop is IExtensionDetails =>
	prop.extension !== undefined && prop.password !== undefined && prop.authtype !== undefined && prop.state !== undefined;
export interface IRegistrationInfo {
	host: string;
	callServerConfig: ICallServerConfigData;
	extensionDetails: IExtensionDetails;
}

export const IRegistrationInfo = (prop: any): prop is IRegistrationInfo =>
	prop.hasOwnProperty('host') && prop.hasOwnProperty('callServerConfig') && prop.hasOwnProperty('extensionDetails');
