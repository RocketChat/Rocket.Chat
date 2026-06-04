import type {
	IGroupVideoConference,
	ILivechatVideoConference,
	IRoom,
	IUser,
	IVideoConferenceParticipant,
	IVideoConferenceRecording,
	IVideoConferenceSummary,
	IVideoConferenceTranscription,
	IVideoConferenceTranscriptEntry,
	VideoConference,
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

	setProviderDataById(callId: string, providerData: Record<string, any> | undefined): Promise<void>;

	addUserById(callId: string, user: Required<Pick<IUser, '_id' | 'name' | 'username' | 'avatarETag'>> & { ts?: Date }): Promise<void>;

	setMessageById(callId: string, messageType: keyof VideoConference['messages'], messageId: string): Promise<void>;

	updateUserReferences(userId: IUser['_id'], username: IUser['username'], name: IUser['name']): Promise<void>;

	increaseAnonymousCount(callId: IGroupVideoConference['_id']): Promise<void>;

	unsetDiscussionRidById(callId: string): Promise<void>;

	setDiscussionRidById(callId: string, discussionRid: IRoom['_id']): Promise<void>;

	unsetDiscussionRid(discussionRid: IRoom['_id']): Promise<void>;

	createVoIP(call: InsertionModel<IVoIPVideoConference>): Promise<string | undefined>;

	// --- Embedded SFU (LiveKit) helpers ---
	// These mirror the per-participant + recording + transcription bookkeeping
	// that URL-based providers don't need. URL providers (Jitsi/Meet/Zoom)
	// never call these.

	findActiveEmbeddedInRoom(rid: IRoom['_id'], providerName: string): Promise<VideoConference | null>;

	findActiveEmbeddedWithRecording(): Promise<VideoConference[]>;

	findEndedAwaitingSummary(): Promise<VideoConference[]>;

	findActiveExpiredEmbedded(maxAgeMs: number, providerName: string): Promise<VideoConference[]>;

	addEmbeddedParticipant(callId: VideoConference['_id'], participant: IVideoConferenceParticipant): Promise<void>;

	markEmbeddedParticipantLeft(callId: VideoConference['_id'], userId: IUser['_id']): Promise<void>;

	setRecordingById(callId: VideoConference['_id'], recording: IVideoConferenceRecording): Promise<void>;

	updateRecordingById(callId: VideoConference['_id'], partial: Partial<IVideoConferenceRecording>): Promise<void>;

	unsetRecordingById(callId: VideoConference['_id']): Promise<void>;

	setTranscriptionById(callId: VideoConference['_id'], transcription: IVideoConferenceTranscription): Promise<void>;

	appendTranscriptEntryById(callId: VideoConference['_id'], entry: IVideoConferenceTranscriptEntry): Promise<void>;

	setSummaryById(callId: VideoConference['_id'], summary: IVideoConferenceSummary): Promise<void>;
}
