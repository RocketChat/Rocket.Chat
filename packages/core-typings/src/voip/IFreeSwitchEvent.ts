import type { IRocketChatRecord } from '../IRocketChatRecord';

export interface IFreeSwitchEvent extends IRocketChatRecord {
	eventName: string;
	detaildEventName: string;

	sequence?: string;
	firedAt?: Date;

	referencedIds?: string[];
	receivedAt?: Date;

	channel?: IFreeSwitchEventChannel;
	call?: IFreeSwitchEventCall;
	caller?: IFreeSwitchEventCaller;
	callee?: IFreeSwitchEventCallee;

	rocketChatVariables?: Record<string, IFreeSwitchEventRocketChatVariable | undefined>;
	users: IFreeSwitchEventCallUser[];

	raw: Record<string, string>;
}

export interface IFreeSwitchEventChannel {
	uniqueId?: string;
	hitDialplan?: boolean;
	name?: string;
	state?: string;

	contact?: string;
}

export interface IFreeSwitchEventRocketChatVariable {
	userId?: string;
	contact?: string;
	sipjsId?: string;
	extension?: string;
	workspaceUrl?: string;
	calleeExtension?: string;
}

export interface IFreeSwitchEventUser {
	type: 'extension' | 'contact' | 'uid' | 'voicemail' | 'unknown';
	value: string;
}

export interface IFreeSwitchEventCallUser {
	uid?: string;
	workspaceUrl?: string;
	presumedWorkspaceUrl?: string;
	identifiers: IFreeSwitchEventUser[];
	reached?: boolean;
	channelUniqueId?: string;
	isVoicemail?: boolean;
}

export interface IFreeSwitchEventCall {
	UUID?: string;
	answerState?: string;
	state?: string;
	previousState?: string;
	sipId?: string;
	authorized?: string;
	hangupCause?: string;
	duration?: number;
	direction?: string;

	originator?: string;
	originatee?: string;
}

export interface IFreeSwitchEventCaller {
	uniqueId?: string;
	direction?: string;
	context?: string;
	name?: string;

	from?: IFreeSwitchEventCallUser;
}

export interface IFreeSwitchEventCallee {
	to?: IFreeSwitchEventCallUser;
}
