import type { IUserDataFile, RocketChatRecordDeleted } from '@rocket.chat/core-typings';
import type { IUserDataFilesModel } from '@rocket.chat/model-typings';
import type { Collection, FindOptions, IndexDescription, InsertOneResult, WithId } from 'mongodb';

import { BaseUploadModelRaw } from './BaseUploadModel';

export class UserDataFilesRaw extends BaseUploadModelRaw implements IUserDataFilesModel {
	constructor(trash?: Collection<RocketChatRecordDeleted<IUserDataFile>>) {
		super('user_data_files', trash);
	}

	protected modelIndexes(): IndexDescription[] {
		return [...super.modelIndexes(), { key: { userId: 1 } }];
	}

	findLastFileByUser(userId: string, options: FindOptions<IUserDataFile> = {}): Promise<IUserDataFile | null> {
		const query = {
			userId,
		};

		options.sort = { _updatedAt: -1 };
		return this.findOne(query, options);
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
