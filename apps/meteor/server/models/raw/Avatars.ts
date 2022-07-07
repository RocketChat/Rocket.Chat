import type { IAvatar, RocketChatRecordDeleted } from '@rocket.chat/core-typings';
import type { IAvatarsModel } from '@rocket.chat/model-typings';
import type { Collection, Db, DeleteResult, IndexDescription, UpdateResult, Document } from 'mongodb';

import { BaseRaw } from './BaseRaw';

export class AvatarsRaw extends BaseRaw<IAvatar> implements IAvatarsModel {
	constructor(db: Db, trash?: Collection<RocketChatRecordDeleted<IAvatar>>) {
		super(db, 'avatars', trash);
	}

	protected modelIndexes(): IndexDescription[] {
		return [
			{ key: { name: 1 }, sparse: true },
			{ key: { rid: 1 }, sparse: true },
		];
	}

	insertAvatarFileInit(
		name: string,
		userId: string,
		store: string,
		file: { name: string },
		extra: object,
	): Promise<Document | UpdateResult> {
		const fileData = {
			name,
			userId,
			store,
			complete: false,
			uploading: true,
			progress: 0,
			extension: file.name.split('.').pop(),
			uploadedAt: new Date(),
		};

		Object.assign(fileData, file, extra);

		return this.updateOne({ _id: name }, fileData, { upsert: true });
	}

	updateFileComplete(fileId: string, userId: string, file: object): Promise<Document | UpdateResult> | undefined {
		if (!fileId) {
			return;
		}

		const filter = {
			_id: fileId,
			userId,
		};

		const update = {
			$set: {
				complete: true,
				uploading: false,
				progress: 1,
			},
		};

		update.$set = Object.assign(file, update.$set);

		return this.updateOne(filter, update);
	}

	async findOneByName(name: string): Promise<IAvatar | null> {
		return this.findOne({ name });
	}

	async findOneByRoomId(rid: string): Promise<IAvatar | null> {
		return this.findOne({ rid });
	}

	async updateFileNameById(fileId: string, name: string): Promise<Document | UpdateResult> {
		const filter = { _id: fileId };
		const update = {
			$set: {
				name,
			},
		};
		return this.updateOne(filter, update);
	}

	async deleteFile(fileId: string): Promise<DeleteResult> {
		return this.deleteOne({ _id: fileId });
	}
}
