import type { IRocketChatRecord } from './IRocketChatRecord';
import type { IUser } from './IUser';

export interface IIncomingIntegration extends IRocketChatRecord {
	type: 'webhook-incoming';
	_createdBy: Pick<IUser, 'username' | '_id'>;
	_createdAt: Date;
	userId: IUser['_id'];
	username: string;
	channel: string[];

	token: string;
	scriptEnabled: boolean;
	script: string;
	scriptCompiled?: string;
	scriptError?: Pick<Error, 'name' | 'message' | 'stack'>;

	name: string;
	enabled: boolean;

	alias?: string;
	avatar?: string;
	emoji?: string;
}

export type OutgoingIntegrationEvent =
	| 'sendMessage'
	| 'fileUploaded'
	| 'roomArchived'
	| 'roomCreated'
	| 'roomJoined'
	| 'roomLeft'
	| 'userCreated';

export interface IOutgoingIntegration extends IRocketChatRecord {
	type: 'webhook-outgoing';
	_createdBy: Pick<IUser, 'username' | '_id'>;
	_createdAt: Date;
	userId: IUser['_id'];
	username: string;
	channel: string[];

	event: OutgoingIntegrationEvent;
	targetRoom?: string;
	urls?: string[];
	triggerWords?: string[];
	triggerWordAnywhere?: boolean;
	token: string;

	scriptEnabled: boolean;
	script: string;
	scriptCompiled?: string;
	scriptError?: Pick<Error, 'name' | 'message' | 'stack'>;
	runOnEdits?: boolean;

	retryFailedCalls?: boolean;
	retryCount?: number;
	retryDelay?: string;
	impersonateUser?: boolean;

	name: string;
	enabled: boolean;

	alias?: string;
	avatar?: string;
	emoji?: string;
}

export type IIntegration = IIncomingIntegration | IOutgoingIntegration;

export type INewIncomingIntegration = Omit<
	IIncomingIntegration,
	'channel' | 'scriptCompiled' | 'scriptError' | '_createdBy' | '_createdAt' | 'userId' | 'token'
> & {
	channel: string;
};

export type INewOutgoingIntegration = Omit<
	IOutgoingIntegration,
	'channel' | 'scriptCompiled' | 'scriptError' | '_createdAt' | '_createdBy' | 'userId'
> & {
	channel?: string;
	token?: string;
};

export type IUpdateIncomingIntegration = Omit<
	IOutgoingIntegration,
	'type' | 'channel' | 'scriptCompiled' | 'scriptError' | '_createdBy' | '_createdAt' | 'userId' | 'token' | 'username'
> & {
	channel?: string;
};

export type IUpdateOutgoingIntegration = Omit<
	IOutgoingIntegration,
	'type' | 'channel' | 'scriptCompiled' | 'scriptError' | '_createdAt' | '_createdBy' | 'userId'
> & {
	channel?: string | string[];
};
