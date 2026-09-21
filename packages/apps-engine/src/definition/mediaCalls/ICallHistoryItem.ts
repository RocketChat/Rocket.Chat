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

export type CallHistoryDirection = 'inbound' | 'outbound';

interface IBaseCallHistoryItem {
	id: string;
	/** The id of the user this entry belongs to */
	uid: string;
	ts: Date;
	callId: string;
	direction: CallHistoryDirection;
	state: CallHistoryItemState;
	type: 'media-call';
	/** The call's duration, in seconds */
	duration: number;
	endedAt: Date;
}

export interface IInternalCallHistoryItem extends IBaseCallHistoryItem {
	external: false;
	contactId: string;
	contactName?: string;
	contactUsername?: string;
	rid?: string;
	/** Id of the message sent after the call ended */
	messageId?: string;
}

export interface IExternalCallHistoryItem extends IBaseCallHistoryItem {
	external: true;
	contactExtension: string;
}

export type ICallHistoryItem = IInternalCallHistoryItem | IExternalCallHistoryItem;
