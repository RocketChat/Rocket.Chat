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
/**
 * How a departure came to be recorded. `reported` is the member's own client saying so; `timeout` is their
 * presence lease running out, which is what covers everything that can stop a client from reporting.
 */
export type VideoConferenceLeaveReason = 'reported' | 'timeout';

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
	/** When they left the call. Cleared if they rejoin, so it only ever describes the latest departure. */
	leftAt?: Date;
	/**
	 * How we learned they left. Absent means they told us — which is also how every entry written before this
	 * existed should be read, since reporting was the only way a departure was recorded then.
	 */
	leftReason?: VideoConferenceLeaveReason;
	/**
	 * When we last had evidence this member was still in the call: their own call window saying so, or the
	 * provider confirming it.
	 *
	 * Presence is a lease rather than a report because the report can be lost — the workspace can be down while
	 * the call carries on in the provider, and a crashed tab, a dead battery or a closed laptop never report at
	 * all. What survives all of those is *the absence of renewals*, which is what this records.
	 */
	lastSeenAt?: Date;
	/**
	 * When we last rang them. A ring is one-shot and short-lived, so this is what tells "their phone is ringing
	 * right now" from "they were rung and did nothing", which decides whether ringing again is offered.
	 */
	ringingAt?: Date;
}

/**
 * Whether a member is actually in the call. Absent `joined` means the entry predates the flag, and back then
 * entries were only written on join — so absent reads as joined.
 */
export const hasJoinedVideoConference = (user: Pick<IVideoConferenceUser, 'joined'>): boolean => user.joined !== false;

/**
 * Whether a member is in the call *right now*, as opposed to having joined it at some point. `joined` never goes
 * back to false — it records that they were there — so presence is the pair of it and not having left since.
 */
export const isInVideoConference = (user: Pick<IVideoConferenceUser, 'joined' | 'leftAt'>): boolean =>
	hasJoinedVideoConference(user) && !user.leftAt;

/**
 * How long a ring is assumed to still be ringing for. A server-originated ring is one-shot: the callee's client
 * gives it 10s before it aborts, so a few seconds beyond that covers the round trip without leaving the caller
 * waiting on a phone that has stopped.
 */
export const VIDEO_CONF_RINGING_WINDOW_MS = 15_000;

/**
 * How many people a single call event may ring. Ringing is decided per event against the list being rung:
 * starting a call rings the room's members, so a large room rings nobody, while adding participants rings just the
 * people added — which is why an add is capped at the same number and therefore always rings.
 *
 * It lives here because both halves of that rule need it: the server deciding whether to ring, and the endpoint
 * capping the batch. They were two constants that had to be kept equal by comment.
 */
export const VIDEO_CONF_RINGING_LIMIT = 10;

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
 * Where a conference's chat lives and who can't read it. Conference membership grants no room access, so a
 * member added from outside the room takes part in the call without seeing its chat; resolving that is a
 * deliberate choice with consequences, so the UI needs enough context to explain them before acting.
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
 * A call that is running now and that the reader may join — what the sidebar and the navbar list so a call can be
 * reached without having caught its ring.
 *
 * Deliberately not the conference record: a list needs enough to decide whether to walk in, and the room it
 * belongs to is not part of that decision. Joining goes by `callId`.
 */
export type JoinableVideoConference = {
	callId: IVideoConference['_id'];
	/** What to call it: the conference's own title, or the room's name. */
	name: string;
	createdAt: Date;
	/** How many people are in it right now. Never zero — an empty call isn't offered. */
	usersCount: number;
	/**
	 * A few of the people in it, so a list can show faces instead of a number. Capped on the server — the count
	 * above is still the whole truth, and what a "+3" is worked out from.
	 */
	participants: Pick<IVideoConferenceUser, '_id' | 'username' | 'name'>[];
	/** Whether the reader is one of them, which is what makes joining another call a matter of leaving this one. */
	joined: boolean;
	/** Whether the reader already turned this call down. The sidebar hides those. */
	declined: boolean;
	/**
	 * When this reader was last rung, if ever. Whether that ring is still live is decided by the reader — see
	 * `isRingingVideoConferenceMember` — so the list can stop presenting a call as ringing without being told.
	 */
	ringingAt?: Date;
};

/** How to give the missing members access: bring them into the room, or move the chat to a discussion. */
export type VideoConferenceChatAccessMode = 'invite' | 'discussion';

export type ExternalVideoConference = IDirectVideoConference | IGroupVideoConference | ILivechatVideoConference;

type InternalVideoConference = IVoIPVideoConference;

export type VideoConference = ExternalVideoConference | InternalVideoConference;

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
