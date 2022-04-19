// TODO: Lib imports should not exists inside the raw models
import { escapeRegExp } from '@rocket.chat/string-helpers';
import {
	CollectionInsertOneOptions,
	Cursor,
	DeleteWriteOpResultObject,
	FilterQuery,
	InsertOneWriteOpResult,
	UpdateOneOptions,
	UpdateQuery,
	UpdateWriteOpResult,
	WithId,
	WriteOpResult,
} from 'mongodb';
import { IUpload as T } from '@rocket.chat/core-typings';

import { BaseRaw, IndexSpecification, InsertionModel } from './BaseRaw';

const fillTypeGroup = (fileData: Partial<T>): void => {
	if (!fileData.type) {
		return;
	}

	fileData.typeGroup = fileData.type.split('/').shift();
};

export class UploadsRaw extends BaseRaw<T> {
	protected modelIndexes(): IndexSpecification[] {
		return [{ key: { rid: 1 } }, { key: { uploadedAt: 1 } }, { key: { typeGroup: 1 } }];
	}

	findNotHiddenFilesOfRoom(roomId: string, searchText: string, fileType: string, limit: number): Cursor<T> {
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

		const fileOptions = {
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
		};

		return this.find(fileQuery, fileOptions);
	}

	insert(fileData: InsertionModel<T>, options?: CollectionInsertOneOptions): Promise<InsertOneWriteOpResult<WithId<T>>> {
		fillTypeGroup(fileData);
		return super.insertOne(fileData, options);
	}

	update(
		filter: FilterQuery<T>,
		update: UpdateQuery<T> | Partial<T>,
		options?: UpdateOneOptions & { multi?: boolean },
	): Promise<WriteOpResult> {
		if ('$set' in update && update.$set) {
			fillTypeGroup(update.$set);
		} else if ('type' in update && update.type) {
			fillTypeGroup(update);
		}

		return super.update(filter, update, options);
	}

	async insertFileInit(userId: string, store: string, file: { name: string }, extra: object): Promise<InsertOneWriteOpResult<WithId<T>>> {
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
		return this.insert(fileData);
	}

	async updateFileComplete(fileId: string, userId: string, file: object): Promise<UpdateWriteOpResult | undefined> {
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

	async deleteFile(fileId: string): Promise<DeleteWriteOpResultObject> {
		return this.deleteOne({ _id: fileId });
	}
}
