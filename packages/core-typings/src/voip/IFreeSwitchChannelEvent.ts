import type { IRocketChatRecord } from '../IRocketChatRecord';
import type { AtLeast } from '../utils';

export interface IFreeSwitchChannelEvent extends IRocketChatRecord {
	channelUniqueId: string;
	eventName: string;
	sequence: string;
	receivedAt: Date;

	firedAt: Date;
	callUniqueId: string;
	channelName: string;
	channelUsername?: string;

	channelState: string;
	channelCallState: string;
	originalChannelCallState?: string;
	answerState?: string;

	callDirection?: string;
	channelHitDialplan?: string;

	hangupCause?: string;
	bridgeUniqueIds?: string[];

	legs: AtLeast<IFreeSwitchChannelEventLeg, 'legName' | 'uniqueId' | 'raw'>[];

	metadata: Record<string, string>;
	// variables should contain the same data you would get by running `uuid_dump` on fs_cli
	variables?: Record<string, string>;
	raw: Record<string, string>;
}

export interface IFreeSwitchChannelEventLeg {
	legName: string;
	type?: string;

	direction: string;
	logicalDirection: string;
	username: string;
	callerName: string;
	callerNumber: string;
	originalCallerName: string;
	originalCallerNumber: string;
	calleeName: string;
	calleeNumber: string;
	networkAddress: string;
	destinationNumber: string;
	uniqueId: string;
	source: string;
	context: string;
	channelName: string;

	profileCreatedTime?: Date;
	channelCreatedTime?: Date;
	channelAnsweredTime?: Date;
	channelProgressTime?: Date;
	channelBridgedTime?: Date;
	channelProgressMediaTime?: Date;
	channelHangupTime?: Date;

	raw: Record<string, string>;
}
