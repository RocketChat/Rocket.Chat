/** How the call ended. */
export type CallHistoryItemState =
	/** One of the users ended the call */
	| 'ended'
	/** Call was not answered */
	| 'not-answered'
	/** The call could not be established */
	| 'failed'
	/** The call was established, but ended due to an error */
	| 'error'
	/** The call ended due to a transfer */
	| 'transferred'
	/** An app refused the call before it rang */
	| 'prevented';

/** Whether the entry's user placed the call or received it. */
export type CallHistoryDirection = 'inbound' | 'outbound';

/**
 * What every entry records, whoever the other party was.
 *
 * An entry belongs to one user. A call between two workspace users leaves one
 * entry on each side, both carrying the same `callId`.
 */
interface IBaseCallHistoryItem {
	id: string;
	/** The id of the user this entry belongs to */
	uid: string;
	/** When the call started. */
	ts: Date;
	callId: string;
	direction: CallHistoryDirection;
	state: CallHistoryItemState;
	type: 'media-call';
	/** The call's duration, in seconds. Zero when nobody answered it. */
	duration: number;
	endedAt: Date;
}

/**
 * An entry for a call between two workspace users. The contact fields describe
 * the other party.
 */
export interface IInternalCallHistoryItem extends IBaseCallHistoryItem {
	external: false;
	contactId: string;
	contactName?: string;
	contactUsername?: string;
	/** The room the call happened in, when it had one. */
	rid?: string;
	/** Id of the message sent after the call ended */
	messageId?: string;
}

/** An entry for a call between a workspace user and a SIP endpoint. */
export interface IExternalCallHistoryItem extends IBaseCallHistoryItem {
	external: true;
	/** The other party's telephony extension. */
	contactExtension: string;
}

/** One entry of a user's call history. */
export type ICallHistoryItem = IInternalCallHistoryItem | IExternalCallHistoryItem;
