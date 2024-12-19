import type { IRocketChatRecord } from '../IRocketChatRecord';

export interface IFreeSwitchEvent extends IRocketChatRecord {
	channelUniqueId?: string;
	eventName: string;
	detaildEventName: string;

	sequence?: string;
	state?: string;
	previousCallState?: string;
	callState?: string;
	timestamp?: string;

	firedAt?: Date;
	answerState?: string;
	hangupCause?: string;

	referencedIds?: string[];
	receivedAt?: Date;

	channelName?: string;
	direction?: string;

	caller?: IFreeSwitchEventCaller;
	call?: IFreeSwitchEventCall;

	eventData: Record<string, string>;
}

export interface IFreeSwitchEventCall {
	UUID?: string;
	answerState?: string;
	state?: string;
	previousState?: string;
	presenceId?: string;
	sipId?: string;
	authorized?: string;
	hangupCause?: string;
	duration?: number;

	from?: {
		user?: string;
		stripped?: string;
		port?: string;
		uri?: string;
		host?: string;
		full?: string;

		userId?: string;
	};

	req?: {
		user?: string;
		port?: string;
		uri?: string;
		host?: string;

		userId?: string;
	};

	to?: {
		user?: string;
		port?: string;
		uri?: string;
		full?: string;
		dialedExtension?: string;
		dialedUser?: string;

		userId?: string;
	};

	contact?: {
		user?: string;
		uri?: string;
		host?: string;

		userId?: string;
	};

	via?: {
		full?: string;
		host?: string;
		rport?: string;

		userId?: string;
	};
}

export interface IFreeSwitchEventCaller {
	uniqueId?: string;
	direction?: string;
	username?: string;
	networkAddr?: string;
	ani?: string;
	destinationNumber?: string;
	source?: string;
	context?: string;
	name?: string;
	number?: string;

	originalCaller?: {
		name?: string;
		number?: string;
	};
	privacy?: {
		hideName?: string;
		hideNumber?: string;
	};
	channel?: {
		name?: string;
		createdTime?: string;
	};
}
