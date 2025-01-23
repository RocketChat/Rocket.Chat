import type { IRocketChatRecord } from '../IRocketChatRecord';

export interface IFreeSwitchEvent extends IRocketChatRecord {
	eventName: string;
	detaildEventName: string;

	sequence?: string;
	firedAt?: Date;

	referencedIds?: string[];
	receivedAt?: Date;

	callerContext?: string;
	callerName?: string;

	channel?: IFreeSwitchEventChannel;
	call?: IFreeSwitchEventCall;
	caller?: IFreeSwitchEventCallUser;
	callee?: IFreeSwitchEventCallUser;

	rocketChatVariables?: Record<string, IFreeSwitchEventRocketChatVariable | undefined>;
	users: IFreeSwitchEventCallUser[];

	otherChannels?: IFreeSwitchEventChannel[];

	raw: Record<string, string>;
}

export interface IFreeSwitchEventChannel {
	uniqueId?: string;
	hitDialplan?: boolean;
	name?: string;
	state?: string;

	type?: string;

	contact?: string;

	callDirection?: string;
	callerDirection?: string;
	callerLogicalDirection?: string;
	callerUniqueId?: string;

	bridgedTo?: string[];
	originator?: string;
	originatees?: string[];
}

export interface IFreeSwitchEventRocketChatVariable {
	userId?: string;
	contact?: string;
	extension?: string;
	workspaceUrl?: string;
	calleeExtension?: string;
}

export interface IFreeSwitchEventUser {
	type: 'extension' | 'contact' | 'uid' | 'voicemail' | 'channel' | 'unknown';
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
}
