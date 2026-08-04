import type { IUserDataFile, RocketChatRecordDeleted } from '@rocket.chat/core-typings';
import type { IUserDataFilesModel } from '@rocket.chat/model-typings';
import type { Collection, Db, FindOptions, IndexDescription } from 'mongodb';

import { BaseUploadModelRaw } from './BaseUploadModel';

export class UserDataFilesRaw extends BaseUploadModelRaw implements IUserDataFilesModel {
	constructor(db: Db, trash?: Collection<RocketChatRecordDeleted<IUserDataFile>>) {
		super(db, 'user_data_files', trash);
	}

	protected override modelIndexes(): IndexDescription[] {
		return [...super.modelIndexes(), { key: { userId: 1 } }];
	}

	findLastFileByUser(userId: string, options: FindOptions<IUserDataFile> = {}): Promise<IUserDataFile | null> {
		const query = {
			userId,
		};

		options.sort = { _updatedAt: -1 };
		return this.findOne(query, options);
	}
}
