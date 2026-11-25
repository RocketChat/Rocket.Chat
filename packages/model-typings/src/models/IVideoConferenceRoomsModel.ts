import type { IRoom, IUser, IVideoConferenceRoom } from '@rocket.chat/core-typings';
import type { DeleteResult, Document, FindCursor } from 'mongodb';

import type { IBaseModel, InsertionModel } from './IBaseModel';
import type { DocumentWithProjection, FindOptionsWithProjection } from '../types/DocumentWithProjection';

export interface IVideoConferenceRoomsModel extends IBaseModel<IVideoConferenceRoom> {
	create(link: Omit<InsertionModel<IVideoConferenceRoom>, 'createdAt'>): Promise<IVideoConferenceRoom['_id']>;

	findOneByUrl<T extends Document = IVideoConferenceRoom, O extends FindOptionsWithProjection<T> = FindOptionsWithProjection<T>>(
		url: IVideoConferenceRoom['url'],
		options?: O,
	): Promise<DocumentWithProjection<T, O> | null>;

	/** Oldest first. */
	findByRoomId<T extends Document = IVideoConferenceRoom, O extends FindOptionsWithProjection<T> = FindOptionsWithProjection<T>>(
		rid: IRoom['_id'],
		options?: O,
	): FindCursor<DocumentWithProjection<T, O>>;

	findUrlsStartingWith<T extends Document = IVideoConferenceRoom, O extends FindOptionsWithProjection<T> = FindOptionsWithProjection<T>>(
		prefix: string,
		options?: O,
	): FindCursor<DocumentWithProjection<T, O>>;

	/** The link as it reads after the change, or `null` when there is no such link. */
	setTitleAndUrlById(
		_id: IVideoConferenceRoom['_id'],
		title: IVideoConferenceRoom['title'],
		url: IVideoConferenceRoom['url'],
	): Promise<IVideoConferenceRoom | null>;

	removeByRoomId(rid: IRoom['_id']): Promise<DeleteResult>;

	updateUserReferences(uid: IUser['_id'], username: IUser['username'], name: IUser['name']): Promise<void>;
}
