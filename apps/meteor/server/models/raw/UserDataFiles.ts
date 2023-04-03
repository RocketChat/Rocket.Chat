import type { IUserDataFile, RocketChatRecordDeleted } from '@rocket.chat/core-typings';
import type { IUserDataFilesModel } from '@rocket.chat/model-typings';
import type { Collection, Db, DeleteResult, FindOptions, IndexDescription, InsertOneResult, UpdateResult, WithId } from 'mongodb';

import { BaseRaw } from './BaseRaw';

export class UserDataFilesRaw extends BaseRaw<IUserDataFile> implements IUserDataFilesModel {
	constructor(db: Db, trash?: Collection<RocketChatRecordDeleted<IUserDataFile>>) {
		super(db, 'user_data_files', trash);
	}

	protected modelIndexes(): IndexDescription[] {
		return [{ key: { userId: 1 } }];
	}

	findLastFileByUser(userId: string, options: FindOptions<IUserDataFile> = {}): Promise<IUserDataFile | null> {
		const query = {
			userId,
		};

		options.sort = { _updatedAt: -1 };
		return this.findOne(query, options);
	}

	async findOneByName(name: string): Promise<IUserDataFile | null> {
		return this.findOne({ name });
	}

	async deleteFile(fileId: string): Promise<DeleteResult> {
		return this.deleteOne({ _id: fileId });
	}

	async findOneByRoomId(rid: string): Promise<IUserDataFile | null> {
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

	// INSERT
	create(data: IUserDataFile): Promise<InsertOneResult<WithId<IUserDataFile>>> {
		const userDataFile = {
			createdAt: new Date(),
			...data,
		};

		return this.insertOne(userDataFile);
	}
}
