import { Base } from './_Base';
import _ from 'underscore';

export class UserDataFiles extends Base {
	constructor() {
		super('user_data_files');

		this.tryEnsureIndex({ userId: 1 });
	}

	// FIND
	findById(id) {
		const query = { _id: id };
		return this.find(query);
	}

	findLastFileByUser(userId, options = {}) {
		const query = {
			userId,
		};

		options.sort = { _updatedAt: -1 };
		return this.findOne(query, options);
	}

	// INSERT
	create(data) {
		const userDataFile = {
			createdAt: new Date,
		};

		_.extend(userDataFile, data);

		return this.insert(userDataFile);
	}

	// REMOVE
	removeById(_id) {
		return this.remove(_id);
	}
}

export default new UserDataFiles();
