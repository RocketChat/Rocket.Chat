import type { IAvatar, IContact, RocketChatRecordDeleted, IUser } from '@rocket.chat/core-typings';
import type { IAvatarsModel } from '@rocket.chat/model-typings';
import type { Collection, Db, IndexDescription, FindOptions, FindCursor } from 'mongodb';

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
			{ key: { contactId: 1 }, sparse: true },
		];
	}

	/**
	 * A contact photo also carries the `userId` of whoever owns the address book, so it has to be
	 * excluded here
	 */
	findOneByUserId(userId: IUser['_id'], options?: FindOptions<IAvatar>) {
		return this.findOne({ userId, contactId: { $exists: false } }, options);
	}

	findOneByETag(etag: string, options?: FindOptions<IAvatar>): Promise<IAvatar | null> {
		return this.findOne({ etag }, options);
	}

	findOneContactAvatar(contactId: IContact['_id'], options?: FindOptions<IAvatar>): Promise<IAvatar | null> {
		return this.findOne({ contactId }, options);
	}

	findContactAvatars(contactIds: IContact['_id'][], options?: FindOptions<IAvatar>): FindCursor<IAvatar> {
		return this.find({ contactId: { $in: contactIds } }, options);
	}
}
