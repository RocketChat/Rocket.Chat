// TODO: Lib imports should not exists inside the raw models
import type { IUpload, RocketChatRecordDeleted } from '@rocket.chat/core-typings';
import type { InsertionModel, IUploadsModel } from '@rocket.chat/model-typings';
import { getCollectionName } from '@rocket.chat/models';
import { escapeRegExp } from '@rocket.chat/string-helpers';
import type {
	Collection,
	CollectionInsertOneOptions,
	Cursor,
	Db,
	DeleteWriteOpResultObject,
	FilterQuery,
	IndexSpecification,
	InsertOneWriteOpResult,
	UpdateOneOptions,
	UpdateQuery,
	UpdateWriteOpResult,
	WithId,
	WriteOpResult,
} from 'mongodb';

import { BaseRaw } from './BaseRaw';

const fillTypeGroup = (fileData: Partial<IUpload>): void => {
	if (!fileData.type) {
		return;
	}

	fileData.typeGroup = fileData.type.split('/').shift();
};

export class UploadsRaw extends BaseRaw<IUpload> implements IUploadsModel {
	constructor(db: Db, trash?: Collection<RocketChatRecordDeleted<IUpload>>) {
		super(db, getCollectionName('uploads'), trash);
	}

	protected modelIndexes(): IndexSpecification[] {
		return [{ key: { rid: 1 } }, { key: { uploadedAt: 1 } }, { key: { typeGroup: 1 } }];
	}

	findNotHiddenFilesOfRoom(roomId: string, searchText: string, fileType: string, limit: number): Cursor<IUpload> {
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

	insert(fileData: InsertionModel<IUpload>, options?: CollectionInsertOneOptions): Promise<InsertOneWriteOpResult<WithId<IUpload>>> {
		fillTypeGroup(fileData);
		return super.insertOne(fileData, options);
	}

	update(
		filter: FilterQuery<IUpload>,
		update: UpdateQuery<IUpload> | Partial<IUpload>,
		options?: UpdateOneOptions & { multi?: boolean },
	): Promise<WriteOpResult> {
		if ('$set' in update && update.$set) {
			fillTypeGroup(update.$set);
		} else if ('type' in update && update.type) {
			fillTypeGroup(update);
		}

		return super.update(filter, update, options);
	}

	async insertFileInit(
		userId: string,
		store: string,
		file: { name: string },
		extra: object,
	): Promise<InsertOneWriteOpResult<WithId<IUpload>>> {
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
