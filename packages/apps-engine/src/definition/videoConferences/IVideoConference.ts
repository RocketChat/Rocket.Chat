import type { IVideoConferenceUser } from './IVideoConferenceUser';

/** A user who joined a conference, and when they did. */
export type VideoConferenceMember = IVideoConferenceUser & {
	/** When the user joined. */
	ts: Date;
	/** The user's avatar tag, which changes when the avatar does. */
	avatarETag?: string | null;
};

/** Where a conference stands. */
export enum VideoConferenceStatus {
	/** The conference is ringing and nobody has answered. */
	CALLING = 0,
	/** The conference is under way. */
	STARTED = 1,
	/** Nobody answered in time. */
	EXPIRED = 2,
	/** The conference finished. */
	ENDED = 3,
	/** The person called refused it. */
	DECLINED = 4,
}

/**
 * A video conference the workspace keeps a record of.
 *
 * Narrow to {@link VideoConference} to tell the three kinds apart; the fields
 * here are the ones they share.
 */
export interface IVideoConference {
	/** The conference's identifier. */
	_id: string;
	/** When the record last changed. */
	_updatedAt: Date;
	/** Which kind of conference this is. */
	type: 'direct' | 'videoconference' | 'livechat';
	/** The room the conference belongs to. */
	rid: string;
	/** Everyone who joined, in the order they arrived. */
	users: Array<VideoConferenceMember>;
	/** Where the conference stands. */
	status: VideoConferenceStatus;
	/** The ids of the system messages announcing the conference in the room. */
	messages: {
		started?: string;
		ended?: string;
	};
	/** Where a participant joins the conference. The provider supplies it. */
	url?: string;

	/** Who opened the conference. */
	createdBy: IVideoConferenceUser;
	/** When the conference was opened. */
	createdAt: Date;

	/** Who closed the conference, when somebody did rather than it lapsing. */
	endedBy?: IVideoConferenceUser;
	/** When the conference finished. */
	endedAt?: Date;

	/** The provider App handling this conference. */
	providerName: string;
	/** Whatever the provider needs to keep with the conference. */
	providerData?: Record<string, any>;

	/** Whether the workspace is still ringing the people invited. */
	ringing?: boolean;
	/** The discussion opened for this conference, when one was. */
	discussionRid?: string;
}

/** A call between the members of a direct message room. */
export interface IDirectVideoConference extends IVideoConference {
	type: 'direct';
}

/** A conference anyone in a channel or team can join. */
export interface IGroupVideoConference extends IVideoConference {
	type: 'videoconference';
	/** How many participants joined without a workspace account. */
	anonymousUsers: number;
	/** The conference's title, shown in the room. */
	title: string;
}

/** A call between an agent and a Livechat visitor. */
export interface ILivechatVideoConference extends IVideoConference {
	type: 'livechat';
}

/** Any video conference, narrowed by its `type`. */
export type VideoConference = IDirectVideoConference | IGroupVideoConference | ILivechatVideoConference;
