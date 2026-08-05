import type { IMessage } from './IMessage/IMessage';
import type { IRocketChatRecord } from './IRocketChatRecord';
import type { IRoom } from './IRoom';
import type { IUser } from './IUser';

export type CallHistoryItemState =
	/** The call is still happening — it is written to history when it starts, not only when it finishes */
	| 'ongoing'
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

/**
 * A conference is room-and-many-participants shaped, unlike the 1:1-contact-shaped media call items above,
 * so it's a sibling variant on the union rather than a fit for `IMediaCallHistoryItem`.
 */
export interface IVideoConferenceHistoryItem extends ICallHistoryItem {
	type: 'video-conference';

	/** The room the conference was started in. */
	rid: IRoom['_id'];

	/** The conference's title, if it had one. */
	title?: string;

	/** How many members actually joined the call (as opposed to being added but never joining). */
	usersCount: number;
}

export type CallHistoryItem = IInternalMediaCallHistoryItem | IExternalMediaCallHistoryItem | IVideoConferenceHistoryItem;
