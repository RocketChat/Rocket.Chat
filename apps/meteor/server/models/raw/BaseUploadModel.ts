import type { IUpload } from '@rocket.chat/core-typings';
import type { IBaseUploadsModel } from '@rocket.chat/model-typings';
import type { DeleteResult, IndexDescription, UpdateResult, Document, InsertOneResult, WithId, Filter } from 'mongodb';

import { BaseRaw } from './BaseRaw';

type T = IUpload;

export abstract class BaseUploadModelRaw extends BaseRaw<T> implements IBaseUploadsModel<T> {
	protected modelIndexes(): IndexDescription[] {
		return [
			{ key: { name: 1 }, sparse: true },
			{ key: { rid: 1 }, sparse: true },
		];
	}

	async insertFileInit(userId: string, store: string, file: { name: string }, extra: object = {}): Promise<InsertOneResult<WithId<T>>> {
		const fileData: Partial<T> = {
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

		if (fileData.type) {
			fileData.typeGroup = fileData.type.split('/').shift();
		}

		return this.insertOne(fileData);
	}

	updateFileComplete(fileId: string, userId: string, file: object): Promise<Document | UpdateResult> | undefined {
		if (!fileId) {
			return;
		}

		const filter = {
			_id: fileId,
			userId,
		};

		const update: Filter<T> = {
			$set: {
				complete: true,
				uploading: false,
				progress: 1,
			},
		};

		update.$set = Object.assign(file, update.$set);

		if (update.$set.type) {
			update.$set.typeGroup = update.$set.type.split('/').shift();
		}

		return this.updateOne(filter, update);
	}

	async findOneByName(name: string): Promise<T | null> {
		return this.findOne({ name });
	}

	async findOneByRoomId(rid: string): Promise<T | null> {
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
