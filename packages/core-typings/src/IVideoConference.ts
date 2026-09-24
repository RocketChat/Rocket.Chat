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
 * A conference **member**, which is not the same as someone currently in the call. Membership authorizes
 * joining and never expires.
 */
/** How a departure was recorded: the member's own client, or their presence lease running out. */
export type VideoConferenceLeaveReason = 'reported' | 'timeout';

export interface IVideoConferenceUser extends Pick<Required<IUser>, '_id' | 'username' | 'name'> {
	avatarETag: string | null;
	/** When the user became a member of the conference. */
	ts: Date;
	joined?: boolean;
	joinedAt?: Date;
	/** The member dismissed the call. Not exclusive with `joined` — they can decline and join later. */
	declined?: boolean;
	declinedAt?: Date;
	/** When they left the call. Cleared if they rejoin, so it only ever describes the latest departure. */
	leftAt?: Date;
	/** How the departure was learned. Absent means reported, which is how pre-existing entries read. */
	leftReason?: VideoConferenceLeaveReason;
	/** When there was last evidence this member was still in the call. */
	lastSeenAt?: Date;
	/** When they were last rung. Tells a phone ringing now from one rung and ignored. */
	ringingAt?: Date;
}

/** Absent `joined` predates the flag, and entries were only written on join then — so absent reads as joined. */
export const hasJoinedVideoConference = (user: Pick<IVideoConferenceUser, 'joined'>): boolean => user.joined !== false;

/** Whether a member is in the call right now. `joined` never returns to false, so `leftAt` is the other half. */
export const isInVideoConference = (user: Pick<IVideoConferenceUser, 'joined' | 'leftAt'>): boolean =>
	hasJoinedVideoConference(user) && !user.leftAt;

/** How long a ring is assumed to still be ringing. The callee's client aborts at 10s; this covers the trip. */
export const VIDEO_CONF_RINGING_WINDOW_MS = 15_000;

/**
 * How many people one ring may reach — a property of the broadcast, not of the conference.
 *
 * `add-participants` caps its batch at the same number, which is what stops an add from silently ringing only
 * part of itself.
 */
export const RING_RECIPIENTS_LIMIT = 10;

/** Whether this member's phone is ringing right now — as opposed to having been rung and done nothing. */
export const isRingingVideoConferenceMember = (
	user: Pick<IVideoConferenceUser, 'ringingAt' | 'declined' | 'declinedAt'>,
	now = Date.now(),
): boolean => {
	if (!user.ringingAt) {
		return false;
	}

	// Answering by declining stops the ringing, even inside the window.
	if (user.declined && user.declinedAt && user.declinedAt.getTime() >= user.ringingAt.getTime()) {
		return false;
	}

	return now - user.ringingAt.getTime() < VIDEO_CONF_RINGING_WINDOW_MS;
};

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

	mediaCallIds?: string[];
	/**
	 * A short numeric address a SIP endpoint can dial to reach this conference, given out while
	 * `Pexip_Integration_SIP_AddAlias` is on.
	 *
	 * Unique among the conferences that currently hold one, not across all of history: the space is only eight
	 * digits, so an alias is released when the call reaches a terminal status and handed out again later.
	 * Nothing may treat it as a stable identifier for a call that has ended.
	 */
	sipAlias?: string;

	/** Endpoints that have dialled in over SIP, counted from the provider's participant events. */
	sipParticipantCount?: number;

	/** Participants that have connected over WebRTC, counted from the provider's participant events. */
	webrtcParticipantCount?: number;
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

/**
 * Where a conference's chat lives and who cannot read it.
 *
 * Conference membership grants no room access, so a member added from outside takes part without seeing it.
 */
export type VideoConferenceChatAccess = {
	rid: IRoom['_id'];
	/** Display name of the room the chat lives in — the history that would be exposed by inviting. */
	name: string;
	type: IRoom['t'];
	membersWithoutAccess: IUser['_id'][];
	/** Whether that room can take the missing members in: a DM can't, so its chat has to move instead. */
	canInvite: boolean;
};

/**
 * A running call the reader may join, as the sidebar and navbar list it.
 *
 * Deliberately not the conference record: a list needs only enough to decide whether to walk in.
 */
export type JoinableVideoConference = {
	callId: IVideoConference['_id'];
	/** What to call it: the conference's own title, or the room's name. */
	name: string;
	createdAt: Date;
	/** How many people are in it right now. Never zero — an empty call isn't offered. */
	usersCount: number;
	/** A few of the people in it, for faces in a list. Capped on the server; `usersCount` is the whole truth. */
	participants: Pick<IVideoConferenceUser, '_id' | 'username' | 'name'>[];
	/** Whether the reader is one of them, which is what makes joining another call a matter of leaving this one. */
	joined: boolean;
	/** Whether the reader already turned this call down. The sidebar hides those. */
	declined: boolean;
	/** When this reader was last rung. Whether it is still live is the reader's to decide. */
	ringingAt?: Date;
};

/** How to give the missing members access: bring them into the room, or move the chat to a discussion. */
export type VideoConferenceChatAccessMode = 'invite' | 'discussion';

export type ExternalVideoConference = IDirectVideoConference | IGroupVideoConference | ILivechatVideoConference;

type InternalVideoConference = IVoIPVideoConference;

export type VideoConference = ExternalVideoConference | InternalVideoConference;

/**
 * A conference, with the chat it moved to described well enough to list it.
 *
 * The call history names a conference after its discussion rather than after whoever started it, so the two
 * fields the list needs are resolved alongside the conference instead of by a second read per row. Absent when
 * the conference has no discussion, or when the room it points at is gone.
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
