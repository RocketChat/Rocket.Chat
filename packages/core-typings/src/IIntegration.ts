import type { IRocketChatRecord } from './IRocketChatRecord';
import type { IUser } from './IUser';

export type IntegrationScriptEngine = 'isolated-vm';

export interface IIncomingIntegration extends IRocketChatRecord {
	type: 'webhook-incoming';
	_createdBy: Pick<IUser, 'username' | '_id'> | null;
	_createdAt: Date;
	userId: IUser['_id'];
	username: string;
	channel: string[];

	token: string;
	scriptEnabled: boolean;
	script: string;
	scriptCompiled?: string;
	scriptError?: Pick<Error, 'name' | 'message' | 'stack'>;
	/**
	 * Whether to transpile the script with Babel before storing it in
	 * `scriptCompiled`. Defaults to `true`. Set to `false` to run the script
	 * as-is inside `isolated-vm` (the 9.0.0 default). Deprecated field —
	 * removed in 9.0.0 together with the Babel transpilation path.
	 */
	scriptTranspile?: boolean;

	name: string;
	enabled: boolean;

	overrideDestinationChannelEnabled?: boolean;
	alias?: string;
	avatar?: string;
	emoji?: string;

	scriptEngine?: IntegrationScriptEngine;
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
	_createdBy: Pick<IUser, 'username' | '_id'> | null;
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
	/**
	 * Whether to transpile the script with Babel before storing it in
	 * `scriptCompiled`. Defaults to `true`. Set to `false` to run the script
	 * as-is inside `isolated-vm` (the 9.0.0 default). Deprecated field —
	 * removed in 9.0.0 together with the Babel transpilation path.
	 */
	scriptTranspile?: boolean;
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

	scriptEngine?: IntegrationScriptEngine;
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
	IIncomingIntegration,
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
