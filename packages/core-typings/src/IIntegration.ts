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

	scriptEnabled: boolean;
	script: string;
	scriptCompiled?: string;
	scriptError?: Pick<Error, 'name' | 'message' | 'stack'>;
	runOnEdits?: boolean;

	retryFailedCalls?: boolean;
	retryCount?: number;
	retryDelay?: string;

	name: string;
	enabled: boolean;
}

export type IIntegration = IIncomingIntegration | IOutgoingIntegration;

export type INewIncomingIntegration = Omit<IIncomingIntegration, 'channel' | 'scriptCompiled' | 'scriptError'> & {
	channel: string;
};

export type INewOutgoingIntegration = Omit<IOutgoingIntegration, 'channel' | 'scriptCompiled' | 'scriptError'> & {
	channel?: string;
};

export type IUpdateOutgoingIntegration = Omit<IOutgoingIntegration, 'channel'> & {
	channel?: string | string[];
};

// alias: Match.Maybe(String),
// avatar: Match.Maybe(String),
// emoji: Match.Maybe(String),
// token: Match.Maybe(String),
// targetChannel: Match.Maybe(String),
