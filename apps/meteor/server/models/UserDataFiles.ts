import type { FindOneOptions, InsertOneWriteOpResult, WithId, WithoutProjection, IndexSpecification } from 'mongodb';
import type { IUserDataFile } from '@rocket.chat/core-typings';

import { ModelClass } from './ModelClass';

export class UserDataFiles extends ModelClass<IUserDataFile> {
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
