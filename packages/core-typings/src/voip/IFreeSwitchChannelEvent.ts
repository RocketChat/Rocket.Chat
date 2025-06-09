import type { IRocketChatRecord } from '../IRocketChatRecord';
import type { AtLeast, DeepPartial } from '../utils';

export interface IFreeSwitchChannelEventHeader {
	sequence: number;
	eventName: string;
	firedAt: Date;
	receivedAt: Date;
}

export interface IFreeSwitchChannelEventMutable {
	// uniqueId of the main channel in the active call, might not actually be unique between different calls.
	// We overwrite this value in some events to ensure it always refer to the same uniqueId even while the call is not active.
	callUniqueId: string;

	// the name of this channel on sofia, might reference the user or contact depending on which process created it
	channelName: string;

	// For valid calls this should be parsed to a valid freeswitch username that is represented by this channel
	// Parsing might fail for voicemail, spam bots and more advanced features we implement in the future.
	channelUsername?: string;

	// Expected: CS_NEW, CS_INIT, CS_ROUTING, CS_EXECUTE, CS_EXCHANGE_MEDIA, CS_CONSUME_MEDIA, CS_HANGUP, CS_REPORTING, CS_DESTROY
	// Not Expected: CS_SOFT_EXECUTE, CS_PARK, CS_HIBERNATE, CS_RESET, CS_NONE
	channelState: string;
	// Multiple state numbers may map to the same state name
	channelStateNumber?: string;
	// DOWN, DIALING, RINGING, EARLY, ACTIVE, HELD, RING_WAIT, HANGUP, UNHELD
	channelCallState: string;
	channelCallStateNumber?: string;
	// The previous value of channelState
	originalChannelCallState?: string;
	// early, ringing, confirmed, answered, hangup, terminated
	answerState?: string;

	// 'inbound' for the channel that initiated the call
	// 'outbound' for the channel(s) that are receiving the call
	callDirection?: string;
	// will usually be true for the channel that initiated the call, if it is using the dialplan
	channelHitDialplan?: string;

	hangupCause?: string;
	bridgeUniqueIds?: string[];

	legs: Record<string, AtLeast<IFreeSwitchChannelEventLeg, 'legName' | 'uniqueId' | 'raw'>>;

	// variables should contain the same data you would get by running `uuid_dump` on fs_cli
	variables?: Record<string, string>;

	// raw will include fields we received from freeswitch but didn't read
	raw: Record<string, string>;

	// Presence is something I'm trying to not depend on, but the info here could be useful for identifying users if there's no other reliable field.
	channelPresenceId?: string;
	presenceCallDirection?: string;
}

export interface IFreeSwitchChannelEvent extends IRocketChatRecord, IFreeSwitchChannelEventHeader, IFreeSwitchChannelEventMutable {
	channelUniqueId: string;

	metadata: Record<string, string>;
}

export type DeepModified<T> = {
	[P in keyof T]?: T[P] extends Date | undefined
		? { oldValue: T[P]; newValue: T[P]; delta: number } | undefined
		: T[P] extends object | undefined
			? DeepModified<T[P]>
			: { oldValue: T[P]; newValue: T[P] } | undefined;
};

export interface IFreeSwitchChannelEventCalculated {
	caller?: string;
	callee?: string;

	rang?: boolean;
	answered?: boolean;
	bridged?: boolean;
	isTransfering?: boolean;
	transfered?: boolean;
}

export interface IFreeSwitchChannelEventParsedMutable extends IFreeSwitchChannelEventMutable, IFreeSwitchChannelEventCalculated {
	//
}

export interface IFreeSwitchChannelEventDelta extends IFreeSwitchChannelEventHeader {
	newValues?: DeepPartial<IFreeSwitchChannelEventParsedMutable>;
	modifiedValues?: DeepModified<IFreeSwitchChannelEventParsedMutable>;
}

export interface IFreeSwitchChannelEventLeg {
	// 'Caller' or 'Other-Leg'; Worthless information
	legName: string;
	// 'originator' or 'originatee', will be undefined if legName !== 'Other-Leg'
	type?: string;

	// 'inbound' for the leg that initiated the call
	// 'outbound' for the leg(s) that are receiving the call
	direction: string;
	// Logical direction is what the other leg would expect the direction of this leg to be
	// If `direction` and `logicalDirection` are different, then the call was probably not started by either side (eg. server called both users)
	logicalDirection: string;

	// Unreliable; Always the username of the user who initiated the first call in the chain, even if they are no longer involved.
	username: string;
	// Unreliable, same as username.
	callerName: string;
	// Unreliable, same as username.
	callerNumber: string;

	// Unreliable, but not as much as username.
	originalCallerName: string;
	// Unreliable, but not as much as username.
	originalCallerNumber: string;

	// Unreliable, same as username.
	calleeName: string;
	// Unreliable, same as username.
	calleeNumber: string;

	networkAddress: string;
	// Kinda reliable, but it can be so many different things depending on the event type, that it's not worth using
	destinationNumber: string;

	// very reliable, always a channel's unique id
	uniqueId: string;
	// very reliable, always a valid channel name
	channelName: string;

	// always 'mod_sofia' in our current use case
	source: string;
	// should match the context from the sip_profile ('default' for internal, 'public' for external), but I haven't tested it with external calls yet
	context: string;

	// If profileIndex is a number higher than 1, then the channel is being reused for a second call
	profileIndex?: string;
	transferSource?: string;

	profileCreatedTime?: Date;
	channelCreatedTime?: Date;
	channelAnsweredTime?: Date;
	channelProgressTime?: Date;
	channelBridgedTime?: Date;
	channelProgressMediaTime?: Date;
	channelHangupTime?: Date;
	channelTransferTime?: Date;
	channelRessurectTime?: Date;
	channelLastHold?: Date;

	// always 'XML' in our current use case
	dialplan?: string;
	// Unreliable, same value as username;
	ani?: string;

	// rdnis is present on transfered calls; Might be an username or a contact name.
	rdnis?: string;

	// No use for those atm
	screenBit?: string;
	privacyHideName?: string;
	privacyHideNumber?: string;

	raw: Record<string, string>;
}
