import type { IMessage } from './IMessage';
import type { IRocketChatRecord } from './IRocketChatRecord';
import type { IRoom } from './IRoom';
import type { IUser } from './IUser';
import type { AtLeast } from './utils';

export type DirectCallParams = {
	uid: IUser['_id'];
	rid: IRoom['_id'];
	callId: string;
};

export type DirectCallData = DirectCallParams & {
	dismissed: boolean;
};

export type ProviderCapabilities = {
	mic?: boolean;
	cam?: boolean;
	title?: boolean;
};

export type CallPreferences = {
	mic?: boolean;
	cam?: boolean;
};

export enum VideoConferenceStatus {
	CALLING = 0,
	STARTED = 1,
	EXPIRED = 2,
	ENDED = 3,
	DECLINED = 4,
}

export type DirectCallInstructions = {
	type: 'direct';
	calleeId: IUser['_id'];
	callId: string;
};

export type ConferenceInstructions = {
	type: 'videoconference';
	callId: string;
	rid: IRoom['_id'];
};

export type LivechatInstructions = {
	type: 'livechat';
	callId: string;
};

export type VideoConferenceType = DirectCallInstructions['type'] | ConferenceInstructions['type'] | LivechatInstructions['type'] | 'voip';

/**
 * Someone associated with a conference — a **member**, which is not the same as someone currently in the
 * call. Membership is what authorizes joining (alongside access to the conference's room), and it never
 * expires.
 *
 * `joined` is optional because every entry written before it existed represents someone who had joined, so
 * readers must treat an absent flag as joined. Use the `hasJoinedVideoConference` helper rather than
 * testing the field directly.
 */
export interface IVideoConferenceUser extends Pick<Required<IUser>, '_id' | 'username' | 'name'> {
	avatarETag: string | null;
	/** When the user became a member of the conference. */
	ts: Date;
	joined?: boolean;
	joinedAt?: Date;
	/**
	 * Set when the member dismissed the call rather than joining. It records what happened; it never ends the
	 * call for anyone else. A member can decline and still join later, so this is not exclusive with `joined`.
	 */
	declined?: boolean;
	declinedAt?: Date;
}

/**
 * Whether a member is actually in the call. Absent `joined` means the entry predates the flag, and back then
 * entries were only written on join — so absent reads as joined.
 */
export const hasJoinedVideoConference = (user: Pick<IVideoConferenceUser, 'joined'>): boolean => user.joined !== false;

export interface IVideoConference extends IRocketChatRecord {
	type: VideoConferenceType;
	rid: string;
	users: IVideoConferenceUser[];
	status: VideoConferenceStatus;
	messages: {
		started?: IMessage['_id'];
		ended?: IMessage['_id'];
	};
	url?: string;

	createdBy: Pick<Required<IUser>, '_id' | 'username' | 'name'>;
	createdAt: Date;

	endedBy?: Pick<Required<IUser>, '_id' | 'username' | 'name'>;
	endedAt?: Date;

	providerName: string;
	providerData?: Record<string, any>;

	ringing?: boolean;
	discussionRid?: IRoom['_id'];
}

export interface IDirectVideoConference extends IVideoConference {
	type: 'direct';
}

export interface IGroupVideoConference extends IVideoConference {
	type: 'videoconference';
	anonymousUsers: number;
	title: string;
}

export interface ILivechatVideoConference extends IVideoConference {
	type: 'livechat';
}

export interface IVoIPVideoConference extends IVideoConference {
	type: 'voip';
	externalId: string;

	callerExtension?: string;
	calleeExtension?: string;
	external?: boolean;
	transferred?: boolean;
	duration?: number;

	events: {
		outgoing?: boolean;
		hold?: boolean;
		park?: boolean;
		bridge?: boolean;
		answer?: boolean;
	};
}

export type ExternalVideoConference = IDirectVideoConference | IGroupVideoConference | ILivechatVideoConference;

type InternalVideoConference = IVoIPVideoConference;

export type VideoConference = ExternalVideoConference | InternalVideoConference;

/**
 * A conference joined with the details of its persistent chat discussion, so a listing can render the
 * discussion's name and latest message without a second round trip per conference.
 */
export type VideoConferenceWithDiscussion = VideoConference & {
	discussionTitle?: string;
	discussionLastMessage?: IMessage;
};

export type VideoConferenceInstructions = DirectCallInstructions | ConferenceInstructions | LivechatInstructions;

export const isDirectVideoConference = (call: VideoConference | undefined | null): call is IDirectVideoConference => {
	return call?.type === 'direct';
};

export const isGroupVideoConference = (call: VideoConference | undefined | null): call is IGroupVideoConference => {
	return call?.type === 'videoconference';
};

export const isLivechatVideoConference = (call: VideoConference | undefined | null): call is ILivechatVideoConference => {
	return call?.type === 'livechat';
};

type GroupVideoConferenceCreateData = Omit<IGroupVideoConference, 'createdBy'> & { createdBy: IUser['_id'] };
type DirectVideoConferenceCreateData = Omit<IDirectVideoConference, 'createdBy'> & { createdBy: IUser['_id'] };
type LivechatVideoConferenceCreateData = Omit<ILivechatVideoConference, 'createdBy'> & { createdBy: IUser['_id'] };
type VoIPVideoConferenceCreateData = Omit<IVoIPVideoConference, 'createdBy'> & { createdBy: IUser['_id'] };

export type VideoConferenceCreateData = AtLeast<
	DirectVideoConferenceCreateData | GroupVideoConferenceCreateData | LivechatVideoConferenceCreateData | VoIPVideoConferenceCreateData,
	'createdBy' | 'type' | 'rid' | 'providerName' | 'providerData'
>;
