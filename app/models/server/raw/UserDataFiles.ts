import { BaseRaw, IndexSpecification } from './BaseRaw';
import { IUserDataFile as T } from '../../../../definition/IUserDataFile';

export class UserDataFilesRaw extends BaseRaw<T> {
	protected indexes: IndexSpecification[] = [
		{ key: { userId: 1 } },
	]

	findLastFileByUser(userId, options = {}) {
		const query = {
			userId,
		};

		options.sort = { _updatedAt: -1 };
		return this.findOne(query, options);
	}

	// INSERT
	create(data: T) {
		const userDataFile = {
			createdAt: new Date(),
			...data,
		};

		return this.insertOne(userDataFile);
	}
}
