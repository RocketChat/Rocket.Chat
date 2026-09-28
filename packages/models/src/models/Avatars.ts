import type { IAvatar, RocketChatRecordDeleted, IUser } from '@rocket.chat/core-typings';
import type { IAvatarsModel } from '@rocket.chat/model-typings';
import type { Collection, Db, Filter, IndexDescription, FindOptions, FindCursor } from 'mongodb';

import { BaseUploadModelRaw } from './BaseUploadModel';

export class AvatarsRaw extends BaseUploadModelRaw implements IAvatarsModel {
	constructor(db: Db, trash?: Collection<RocketChatRecordDeleted<IAvatar>>) {
		super(db, 'avatars', trash);
	}

	protected override modelIndexes(): IndexDescription[] {
		return [
			...super.modelIndexes(),
			{ key: { userId: 1 }, sparse: true },
			{ key: { etag: 1 }, sparse: true }, // avatars are queried by etag (specially for federation)
			{ key: { userId: 1, folderId: 1, externalId: 1 }, sparse: true },
		];
	}

	/**
	 * A contact photo also carries the `userId` of whoever owns the address book, so it has to be
	 * excluded here
	 */
	findOneByUserId(userId: IUser['_id'], options?: FindOptions<IAvatar>) {
		return this.findOne({ userId, externalId: { $exists: false } }, options);
	}

	findOneByETag(etag: string, options?: FindOptions<IAvatar>): Promise<IAvatar | null> {
		return this.findOne({ etag }, options);
	}

	findOneContactAvatar(userId: IUser['_id'], folderId: string, externalId: string, options?: FindOptions<IAvatar>): Promise<IAvatar | null> {
		return this.findOne({ userId, folderId, externalId }, options);
	}

	findContactAvatars(
		userId: IUser['_id'],
		folderId: string,
		externalIds?: { in: string[] } | { notIn: string[] },
		options?: FindOptions<IAvatar>,
	): FindCursor<IAvatar> {
		const query: Filter<IAvatar> = { userId, folderId };

		if (externalIds && 'in' in externalIds) {
			query.externalId = { $in: externalIds.in };
		}

		if (externalIds && 'notIn' in externalIds) {
			query.externalId = { $nin: externalIds.notIn };
		}

		return this.find(query, options);
	}
}
