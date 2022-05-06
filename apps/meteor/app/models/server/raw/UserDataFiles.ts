import { FindOneOptions, InsertOneWriteOpResult, WithId, WithoutProjection } from 'mongodb';
import { IUserDataFile as T } from '@rocket.chat/core-typings';

import { BaseRaw, IndexSpecification } from './BaseRaw';

export class UserDataFilesRaw extends BaseRaw<T> {
	protected modelIndexes(): IndexSpecification[] {
		return [{ key: { userId: 1 } }];
	}

	findLastFileByUser(userId: string, options: WithoutProjection<FindOneOptions<T>> = {}): Promise<T | null> {
		const query = {
			userId,
		};

		options.sort = { _updatedAt: -1 };
		return this.findOne(query, options);
	}

	// INSERT
	create(data: T): Promise<InsertOneWriteOpResult<WithId<T>>> {
		const userDataFile = {
			createdAt: new Date(),
			...data,
		};

		return this.insertOne(userDataFile);
	}
}
