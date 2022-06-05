import type { FindOneOptions, InsertOneWriteOpResult, WithId, WithoutProjection, IndexSpecification } from 'mongodb';
import type { IUserDataFile } from '@rocket.chat/core-typings';
import type { IUserDataFilesModel } from '@rocket.chat/model-typings';

import { BaseRaw } from './BaseRaw';

export class UserDataFilesRaw extends BaseRaw<IUserDataFile> implements IUserDataFilesModel {
	protected modelIndexes(): IndexSpecification[] {
		return [{ key: { userId: 1 } }];
	}

	findLastFileByUser(userId: string, options: WithoutProjection<FindOneOptions<IUserDataFile>> = {}): Promise<IUserDataFile | null> {
		const query = {
			userId,
		};

		options.sort = { _updatedAt: -1 };
		return this.findOne(query, options);
	}

	// INSERT
	create(data: IUserDataFile): Promise<InsertOneWriteOpResult<WithId<IUserDataFile>>> {
		const userDataFile = {
			createdAt: new Date(),
			...data,
		};

		return this.insertOne(userDataFile);
	}
}
