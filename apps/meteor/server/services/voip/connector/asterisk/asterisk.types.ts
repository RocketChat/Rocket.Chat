/* eslint-disable @typescript-eslint/interface-name-prefix */
import type { IExtensionDetails, IQueueDetails, IQueueMember, IEventBase } from '@rocket.chat/core-typings';

// Each event from asterisk has a different shape, and it solely depends on what asterisk wants to send
// There are even some props that are not required _all the times_, so different payloads from same event may have different shapes :')
export type AsteriskManagerEvent = {
	event: string;
	actionid: string;
} & { [key: string]: string };

export type AmiCommand = {
	action?: 'queuesummary' | 'queuestatus' | 'pjsipshowendpoints' | 'pjsipshowendpoint';
	queue?: string;
	endpoint?: string;
};

/**
 * This class serves as a a base class for the different kind of call server objects
 * @remarks
 */
export enum CommandType {
	ARI,
	AMI,
	AGI,
}

export type ACDCommandResult = { queueSummary?: ACDQueueInfo[]; queueStatus?: IQueueDetails };

export interface ACDQueueSummaryEvent extends AsteriskManagerEvent {
	queue: string;
	loggedin: string;
	available: string;
	callers: string;
	holdtime: string;
	talktime: string;
	// TODO: check if this is a typo
	logestholdtime: string;
}

export type ACDQueueInfo = {
	name: string;
	loggedin: string;
	available: string;
	callers: string;
	holdtime: string;
	talktime: string;
	logestholdtime: string;
};

export type ACDQueueStatusEvent = AsteriskManagerEvent &
	IQueueDetails & {
		queue: string;
	};

export interface ACDQueueMemberEvent extends AsteriskManagerEvent, IQueueMember {
	queue: string;
}

export type CommandParams = {
	queueName?: string;
	extension?: string;
};

export interface EndpointListEvent extends AsteriskManagerEvent {
	aor: string;
	objectname: string;
	devicestate: string;
}

export interface EndpointInfoEvent extends AsteriskManagerEvent {
	event: string;
	objectname: string;
	devicestate: string;
	password: string;
	authtype: string;
}

export type PJSIPCommandResult = {
	endpoints?: IExtensionDetails[];
	endpoint?: IExtensionDetails;
};

export type IActionEvent =
	| IEventBase
	| ACDQueueSummaryEvent
	| ACDQueueStatusEvent
	| ACDQueueMemberEvent
	| EndpointListEvent
	| EndpointInfoEvent;
