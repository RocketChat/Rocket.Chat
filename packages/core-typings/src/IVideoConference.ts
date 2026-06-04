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

export interface IVideoConferenceUser extends Pick<Required<IUser>, '_id' | 'username' | 'name'> {
	avatarETag: string | null;
	ts: Date;
}

/**
 * Per-participant join/leave tracking. Used by embedded-SFU providers
 * (e.g. LiveKit) where the room may persist across users joining and leaving
 * independently. URL-based providers (Jitsi/Meet/Zoom) leave this undefined
 * — they only know if the call is open at all, not who's currently in.
 */
export type IVideoConferenceParticipant = {
	id: IUser['_id'];
	username?: string;
	displayName?: string;
	joinedAt?: Date;
	leftAt?: Date;
};

export type IVideoConferenceRecording = {
	/** Provider-specific id (e.g. LiveKit egressId). */
	egressId: string;
	startedAt: Date;
	endedAt?: Date;
	fileUrl?: string;
	storage: 'local' | 's3' | 'filestore' | 'both';
	uploadId?: string;
	uploadKey?: string;
	filename?: string;
	messageSent?: boolean;
};

export type IVideoConferenceTranscription = {
	enabled: boolean;
	startedAt?: Date;
	startedBy?: IUser['_id'];
	endedAt?: Date;
};

export type IVideoConferenceTranscriptEntry = {
	participantId: IUser['_id'];
	text: string;
	startedAt: Date;
	endedAt?: Date;
};

export type IVideoConferenceSummary = {
	generatedAt: Date;
	/** Message id of the posted AI summary (thread reply under the call message). */
	messageId?: IMessage['_id'];
	/** Message id of the raw transcript posted as a .md file in the same thread. */
	transcriptMessageId?: IMessage['_id'];
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

	/**
	 * Optional embedded-SFU fields. Populated by providers that run the
	 * call inside Rocket.Chat (LiveKit) rather than handing off to an
	 * external URL. URL-based providers (Jitsi/Meet/Zoom) leave these
	 * undefined.
	 */
	participants?: IVideoConferenceParticipant[];
	recording?: IVideoConferenceRecording;
	transcription?: IVideoConferenceTranscription;
	transcript?: IVideoConferenceTranscriptEntry[];
	summary?: IVideoConferenceSummary;
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
