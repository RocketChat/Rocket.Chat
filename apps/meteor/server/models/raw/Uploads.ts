// TODO: Lib imports should not exists inside the raw models
import type { IUpload, RocketChatRecordDeleted } from '@rocket.chat/core-typings';
import type { FindPaginated, IUploadsModel } from '@rocket.chat/model-typings';
import type { Collection, FindCursor, Db, DeleteResult, IndexDescription, InsertOneResult, UpdateResult, WithId, Filter } from 'mongodb';
import { escapeRegExp } from '@rocket.chat/string-helpers';

import { BaseRaw } from './BaseRaw';

const fillTypeGroup = (fileData: Partial<IUpload>): void => {
	if (!fileData.type) {
		return;
	}

	fileData.typeGroup = fileData.type.split('/').shift();
};

export class UploadsRaw extends BaseRaw<IUpload> implements IUploadsModel {
	constructor(db: Db, trash?: Collection<RocketChatRecordDeleted<IUpload>>) {
		super(db, 'uploads', trash);
	}

	protected modelIndexes(): IndexDescription[] {
		return [{ key: { rid: 1 } }, { key: { uploadedAt: 1 } }, { key: { typeGroup: 1 } }];
	}

	findNotHiddenFilesOfRoom(roomId: string, searchText: string, fileType: string, limit: number): FindCursor<IUpload> {
		const fileQuery = {
			rid: roomId,
			complete: true,
			uploading: false,
			_hidden: {
				$ne: true,
			},

			...(searchText && { name: { $regex: new RegExp(escapeRegExp(searchText), 'i') } }),
			...(fileType && fileType !== 'all' && { typeGroup: fileType }),
		};

		return this.find(fileQuery, {
			limit,
			sort: {
				uploadedAt: -1,
			},
			projection: {
				_id: 1,
				userId: 1,
				rid: 1,
				name: 1,
				description: 1,
				type: 1,
				url: 1,
				uploadedAt: 1,
				typeGroup: 1,
			},
		});
	}

	async insertFileInit(userId: string, store: string, file: { name: string }, extra: object): Promise<InsertOneResult<WithId<IUpload>>> {
		const fileData = {
			userId,
			store,
			complete: false,
			uploading: true,
			progress: 0,
			extension: file.name.split('.').pop(),
			uploadedAt: new Date(),
			...file,
			...extra,
		};

		fillTypeGroup(fileData);
		return this.insertOne(fileData);
	}

	async updateFileComplete(fileId: string, userId: string, file: object): Promise<UpdateResult | undefined> {
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

		fillTypeGroup(update.$set);
		return this.updateOne(filter, update);
	}

	async deleteFile(fileId: string): Promise<DeleteResult> {
		return this.deleteOne({ _id: fileId });
	}

	findPaginatedWithoutThumbs(query: Filter<IUpload> = {}, options?: any): FindPaginated<FindCursor<WithId<IUpload>>> {
		return this.findPaginated(
			{
				...query,
				typeGroup: { $ne: 'thumb' },
			},
			options,
		);
	}
}
