import type { IRocketChatRecord } from './IRocketChatRecord';

export interface IPbxEvent extends IRocketChatRecord {
	uniqueId: string;
	event: string;
	phone?: string; // calleridnum
	queue?: string; // queue
	ts: Date; // the moment when event happened
	holdTime?: string;
	callUniqueId?: string;
	// most of the times, this will be the same as callUniqueId
	// theres some scenarios where the "channel" of the call changed
	// and therefore a new "link" will be created for the call. That will generate a
	// new uniqueId for events
	callUniqueIdFallback?: string;
	agentExtension?: string;
}
