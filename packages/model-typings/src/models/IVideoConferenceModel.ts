import type {
	IGroupVideoConference,
	ILivechatVideoConference,
	IRoom,
	IUser,
	IVideoConferenceParticipant,
	VideoConference,
	VideoConferenceLeaveReason,
	VideoConferenceStatus,
	IVoIPVideoConference,
} from '@rocket.chat/core-typings';
import type { FindCursor, UpdateOptions, UpdateFilter, UpdateResult, FindOptions } from 'mongodb';

import type { FindPaginated, IBaseModel, InsertionModel } from './IBaseModel';

export interface IVideoConferenceModel extends IBaseModel<VideoConference> {
	findPaginatedByRoomId(
		rid: IRoom['_id'],
		{ offset, count }: { offset?: number; count?: number },
	): FindPaginated<FindCursor<VideoConference>>;

	findAllLongRunning(minDate: Date): Promise<FindCursor<Pick<VideoConference, '_id'>>>;

	countByTypeAndStatus(
		type: VideoConference['type'],
		status: VideoConferenceStatus,
		options: FindOptions<VideoConference>,
	): Promise<number>;

	createDirect({ providerName, ...callDetails }: Pick<VideoConference, 'rid' | 'createdBy' | 'providerName'>): Promise<string>;

	createGroup({
		providerName,
		...callDetails
	}: Required<Pick<IGroupVideoConference, 'rid' | 'title' | 'createdBy' | 'providerName'>>): Promise<string>;

	createLivechat({
		providerName,
		...callDetails
	}: Required<Pick<ILivechatVideoConference, 'rid' | 'createdBy' | 'providerName'>>): Promise<string>;

	updateOneById(
		_id: string,
		update: UpdateFilter<VideoConference> | Partial<VideoConference>,
		options?: UpdateOptions,
	): Promise<UpdateResult>;

	setDataById(callId: string, data: Partial<Omit<VideoConference, '_id'>>): Promise<void>;

	setEndedById(callId: string, endedBy?: { _id: string; name: string; username: string }, endedAt?: Date): Promise<void>;

	setRingingById(callId: string, ringing: boolean): Promise<void>;

	setStatusById(callId: string, status: VideoConference['status']): Promise<void>;

	setUrlById(callId: string, url: string): Promise<void>;

	/** Names a group conference. Only that kind carries a title of its own. */
	setTitleById(callId: string, title: string): Promise<void>;

	setProviderDataById(callId: string, providerData: Record<string, any> | undefined): Promise<void>;

	/** Associates a user with the call. It never marks them present — `setUserJoinedById` is what arriving does. */
	addMemberById(callId: string, user: Required<Pick<IUser, '_id' | 'name' | 'username' | 'avatarETag'>> & { ts?: Date }): Promise<void>;

	setUserJoinedById(callId: string, uid: IUser['_id'], joinedAt?: Date): Promise<void>;

	setUserDeclinedById(callId: string, uid: IUser['_id'], declinedAt?: Date): Promise<void>;
	setUserLeftById(callId: string, uid: IUser['_id'], leftAt?: Date, reason?: VideoConferenceLeaveReason): Promise<void>;
	setUsersRingingById(callId: string, uids: IUser['_id'][], ringingAt?: Date): Promise<void>;

	/** Renews one member's presence lease, and with it any departure that was inferred rather than reported. */
	renewUserPresenceById(
		callId: string,
		uid: IUser['_id'],
		lastSeenAt?: Date,
		inferredReasons?: VideoConferenceLeaveReason[],
	): Promise<void>;

	/** Renews several leases at once, as a provider reporting who is in its room does. */
	renewUsersPresenceById(callId: string, uids: IUser['_id'][], lastSeenAt?: Date): Promise<void>;

	/** Every open call, with the roster and provider the presence sweep judges it by. */
	findActiveWithMembers(): FindCursor<Pick<VideoConference, '_id' | 'rid' | 'users' | 'providerName'>>;

	setMessageById(callId: string, messageType: keyof VideoConference['messages'], messageId: string): Promise<void>;

	updateUserReferences(userId: IUser['_id'], username: IUser['username'], name: IUser['name']): Promise<void>;

	increaseAnonymousCount(callId: IGroupVideoConference['_id']): Promise<void>;

	unsetDiscussionRidById(callId: string): Promise<void>;

	setDiscussionRidById(callId: string, discussionRid: IRoom['_id']): Promise<void>;

	unsetDiscussionRid(discussionRid: IRoom['_id']): Promise<void>;

	createVoIP(call: InsertionModel<IVoIPVideoConference>): Promise<string | undefined>;

	// --- Embedded SFU (LiveKit) helpers ---
	// These mirror the per-participant bookkeeping
	// that URL-based providers don't need. URL providers (Jitsi/Meet/Zoom)
	// never call these.

	addEmbeddedParticipant(callId: VideoConference['_id'], participant: IVideoConferenceParticipant): Promise<void>;

	markEmbeddedParticipantLeft(callId: VideoConference['_id'], userId: IUser['_id'], leftAt?: Date): Promise<void>;
}
