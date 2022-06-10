import type { IQueueSummary } from './ACDQueues';
import type { IUser } from './IUser';
import type { IExtensionDetails, IRegistrationInfo } from './voip';

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

export const isIExtensionDetails = (prop: any): prop is IExtensionDetails =>
	prop.extension !== undefined && prop.password !== undefined && prop.authtype !== undefined && prop.state !== undefined;

export const isIRegistrationInfo = (prop: any): prop is IRegistrationInfo =>
	prop.hasOwnProperty('host') && prop.hasOwnProperty('callServerConfig') && prop.hasOwnProperty('extensionDetails');
