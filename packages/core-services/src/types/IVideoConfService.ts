import type {
	IRoom,
	IStats,
	IUser,
	IVoIPVideoConference,
	VideoConference,
	JoinableVideoConference,
	VideoConferenceCapabilities,
	VideoConferenceChatAccess,
	VideoConferenceChatAccessMode,
	VideoConferenceCreateData,
	VideoConferenceInstructions,
} from '@rocket.chat/core-typings';
import type { InsertionModel } from '@rocket.chat/model-typings';
import type { PaginatedResult } from '@rocket.chat/rest-typings';
import type * as UiKit from '@rocket.chat/ui-kit';

export type VideoConferenceJoinOptions = {
	mic?: boolean;
	cam?: boolean;
};

export interface IVideoConfService {
	create(data: VideoConferenceCreateData, useAppUser?: boolean): Promise<VideoConferenceInstructions>;
	start(caller: IUser['_id'], rid: string, options: { title?: string; allowRinging?: boolean }): Promise<VideoConferenceInstructions>;
	join(uid: IUser['_id'] | undefined, callId: VideoConference['_id'], options: VideoConferenceJoinOptions): Promise<string>;
	getInfo(callId: VideoConference['_id'], uid: IUser['_id'] | undefined): Promise<UiKit.ModalSurfaceLayout>;
	cancel(uid: IUser['_id'], callId: VideoConference['_id']): Promise<void>;
	get(callId: VideoConference['_id']): Promise<Omit<VideoConference, 'providerData'> | null>;
	getUnfiltered(callId: VideoConference['_id']): Promise<VideoConference | null>;
	list(roomId: IRoom['_id'], pagination?: { offset?: number; count?: number }): Promise<PaginatedResult<{ data: VideoConference[] }>>;
	setProviderData(callId: VideoConference['_id'], data: VideoConference['providerData'] | undefined): Promise<void>;
	setEndedBy(callId: VideoConference['_id'], endedBy: IUser['_id']): Promise<void>;
	setEndedAt(callId: VideoConference['_id'], endedAt: Date): Promise<void>;
	setStatus(callId: VideoConference['_id'], status: VideoConference['status']): Promise<void>;
	addUser(callId: VideoConference['_id'], userId?: IUser['_id'], ts?: Date): Promise<void>;
	listProviders(): Promise<{ key: string; label: string }[]>;
	listCapabilities(): Promise<{ providerName: string; capabilities: VideoConferenceCapabilities }>;
	listProviderCapabilities(providerName: string): Promise<VideoConferenceCapabilities>;
	declineLivechatCall(callId: VideoConference['_id']): Promise<boolean>;
	diagnoseProvider(uid: string, rid: string, providerName?: string): Promise<string | undefined>;
	getStatistics(): Promise<IStats['videoConf']>;
	validateAction(
		event: string,
		caller: IUser['_id'],
		params: { callId: VideoConference['_id']; uid: IUser['_id']; rid: IRoom['_id'] },
	): Promise<boolean>;
	assignDiscussionToConference(callId: VideoConference['_id'], rid: IRoom['_id'] | undefined): Promise<void>;
	addMembers(
		uid: IUser['_id'],
		callId: VideoConference['_id'],
		usernames: NonNullable<IUser['username']>[],
		options?: { ring?: boolean },
	): Promise<IUser['_id'][]>;
	declineCall(uid: IUser['_id'], callId: VideoConference['_id']): Promise<void>;
	leaveCall(uid: IUser['_id'], callId: VideoConference['_id']): Promise<void>;
	/** Renews the caller's presence lease on a call, which is what stops them being treated as gone. */
	renewPresence(uid: IUser['_id'], callId: VideoConference['_id']): Promise<void>;
	/** Marks everyone whose presence lease has run out as having left, and ends the calls that empties. */
	expirePresenceLeases(now?: Date): Promise<void>;
	/** Rings one member who isn't in the call, again; says whether the ring went out. */
	ringMember(uid: IUser['_id'], callId: VideoConference['_id'], memberId: IUser['_id']): Promise<boolean>;
	listJoinableCalls(uid: IUser['_id']): Promise<JoinableVideoConference[]>;
	getChatAccess(uid: IUser['_id'], callId: VideoConference['_id']): Promise<VideoConferenceChatAccess>;
	shareChatWithMembers(uid: IUser['_id'], callId: VideoConference['_id'], mode?: VideoConferenceChatAccessMode): Promise<IRoom['_id']>;

	renameCall(uid: IUser['_id'], callId: VideoConference['_id'], title: string): Promise<void>;
	createVoIP(data: InsertionModel<IVoIPVideoConference>): Promise<IVoIPVideoConference['_id'] | undefined>;
}
