import type { Cursor, UpdateOneOptions, UpdateQuery, UpdateWriteOpResult, FindOneOptions } from 'mongodb';
import type {
	IGroupVideoConference,
	ILivechatVideoConference,
	IRoom,
	IUser,
	VideoConference,
	VideoConferenceStatus,
} from '@rocket.chat/core-typings';

import type { IBaseModel } from './IBaseModel';

export interface IVideoConferenceModel extends IBaseModel<VideoConference> {
	findAllByRoomId(rid: IRoom['_id'], { offset, count }: { offset?: number; count?: number }): Promise<Cursor<VideoConference>>;

	findAllLongRunning(minDate: Date): Promise<Cursor<Pick<VideoConference, '_id'>>>;

	countByTypeAndStatus(
		type: VideoConference['type'],
		status: VideoConferenceStatus,
		options: FindOneOptions<VideoConference>,
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
		update: UpdateQuery<VideoConference> | Partial<VideoConference>,
		options?: UpdateOneOptions,
	): Promise<UpdateWriteOpResult>;

	setDataById(callId: string, data: Partial<Omit<VideoConference, '_id'>>): Promise<void>;

	setEndedById(callId: string, endedBy?: { _id: string; name: string; username: string }, endedAt?: Date): Promise<void>;

	setRingingById(callId: string, ringing: boolean): Promise<void>;

	setStatusById(callId: string, status: VideoConference['status']): Promise<void>;

	setUrlById(callId: string, url: string): Promise<void>;

	setProviderDataById(callId: string, providerData: Record<string, any> | undefined): Promise<void>;

	addUserById(callId: string, user: Pick<IUser, '_id' | 'name' | 'username' | 'avatarETag'> & { ts?: Date }): Promise<void>;

	setMessageById(callId: string, messageType: keyof VideoConference['messages'], messageId: string): Promise<void>;

	updateUserReferences(userId: IUser['_id'], username: IUser['username'], name: IUser['name']): Promise<void>;

	increaseAnonymousCount(callId: IGroupVideoConference['_id']): Promise<void>;
}
