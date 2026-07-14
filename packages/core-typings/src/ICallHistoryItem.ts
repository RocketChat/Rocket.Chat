import type { IMessage } from './IMessage/IMessage';
import type { IRocketChatRecord } from './IRocketChatRecord';
import type { IRoom } from './IRoom';
import type { IUser } from './IUser';

export type CallHistoryItemState =
	/** One of the users ended the call */
	| 'ended'
	/** Call was not answered */
	| 'not-answered'
	/** The call could not be established */
	| 'failed'
	/** The call was established, but it ended due to an error */
	| 'error'
	/** The call ended due to a transfer */
	| 'transferred';

interface ICallHistoryItem extends IRocketChatRecord {
	uid: IUser['_id'];
	ts: Date;

	callId: string;

	direction: 'inbound' | 'outbound';
	state: CallHistoryItemState;
}

interface IMediaCallHistoryItem extends ICallHistoryItem {
	type: 'media-call';
	external: boolean;

	/* The call's duration, in seconds */
	duration: number;
	endedAt: Date;
}

export interface IInternalMediaCallHistoryItem extends IMediaCallHistoryItem {
	external: false;
	contactId: IUser['_id'];
	contactName?: IUser['name'];
	contactUsername?: IUser['username'];

	rid?: IRoom['_id'];
	messageId?: IMessage['_id']; // Id of the message that was sent after the call ended
}

export interface IExternalMediaCallHistoryItem extends IMediaCallHistoryItem {
	external: true;

	contactExtension: string;
}

export interface IMitelCallHistoryItem extends ICallHistoryItem {
	type: 'mitel';

	contactNumber?: string;
	contactName?: string;
	contactId?: IUser['_id'];
	contactUsername?: IUser['username'];

	duration: number;

	transferredFrom?: {
		number?: string;
		name?: string;
		username?: IUser['username'];
		uid?: IUser['_id'];
	};

	transferredTo?: {
		number?: string;
		name?: string;
		username?: IUser['username'];
		uid?: IUser['_id'];
	};

	transferred?: boolean;
	diverted?: boolean;
}

export type CallHistoryItem = IInternalMediaCallHistoryItem | IExternalMediaCallHistoryItem | IMitelCallHistoryItem;
