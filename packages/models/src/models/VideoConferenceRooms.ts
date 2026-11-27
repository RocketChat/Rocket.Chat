import type { IRoom, IUser, IVideoConferenceRoom } from '@rocket.chat/core-typings';
import type {
	DocumentWithProjection,
	FindOptionsWithProjection,
	InsertionModel,
	IVideoConferenceRoomsModel,
} from '@rocket.chat/model-typings';
import { escapeRegExp } from '@rocket.chat/tools';
import type { Db, DeleteResult, Document, FindCursor, IndexDescription } from 'mongodb';

import { BaseRaw } from './BaseRaw';

export class VideoConferenceRoomsRaw extends BaseRaw<IVideoConferenceRoom> implements IVideoConferenceRoomsModel {
	constructor(db: Db) {
		super(db, 'video_conference_rooms');
	}

	protected override modelIndexes(): IndexDescription[] {
		return [{ key: { url: 1 }, unique: true }, { key: { rid: 1, createdAt: 1 } }];
	}

	public async create(link: Omit<InsertionModel<IVideoConferenceRoom>, 'createdAt'>): Promise<IVideoConferenceRoom['_id']> {
		return (await this.insertOne({ ...link, createdAt: new Date() })).insertedId;
	}

	public findOneByUrl<T extends Document = IVideoConferenceRoom, O extends FindOptionsWithProjection<T> = FindOptionsWithProjection<T>>(
		url: IVideoConferenceRoom['url'],
		options?: O,
	): Promise<DocumentWithProjection<T, O> | null> {
		return this.findOne<T, O>({ url }, options);
	}

	public findByRoomId<T extends Document = IVideoConferenceRoom, O extends FindOptionsWithProjection<T> = FindOptionsWithProjection<T>>(
		rid: IRoom['_id'],
		options?: O,
	): FindCursor<DocumentWithProjection<T, O>> {
		return this.find<T, O>({ rid }, { sort: { createdAt: 1 }, ...options } as O);
	}

	public findUrlsStartingWith<
		T extends Document = IVideoConferenceRoom,
		O extends FindOptionsWithProjection<T> = FindOptionsWithProjection<T>,
	>(prefix: string, options?: O): FindCursor<DocumentWithProjection<T, O>> {
		return this.find<T, O>({ url: { $regex: `^${escapeRegExp(prefix)}` } }, options);
	}

	public setTitleAndUrlById(
		_id: IVideoConferenceRoom['_id'],
		title: IVideoConferenceRoom['title'],
		url: IVideoConferenceRoom['url'],
	): Promise<IVideoConferenceRoom | null> {
		return this.findOneAndUpdate({ _id }, { $set: { title, url } }, { returnDocument: 'after' });
	}

	public removeByRoomId(rid: IRoom['_id']): Promise<DeleteResult> {
		return this.deleteMany({ rid });
	}

	public async updateUserReferences(uid: IUser['_id'], username: IUser['username'], name: IUser['name']): Promise<void> {
		await this.updateMany({ 'createdBy._id': uid }, { $set: { 'createdBy.name': name, 'createdBy.username': username } });
	}
}
