import { Base } from './_Base';

export class Statistics extends Base {
	constructor() {
		super('statistics');

		this.tryEnsureIndex({ createdAt: 1 });
	}

	// FIND ONE
	findOneById(_id, options) {
		const query = { _id };
		return this.findOne(query, options);
	}

	findLast() {
		const options = {
			sort: {
				createdAt: -1,
			},
			limit: 1,
		};
		const records = this.find({}, options).fetch();
		return records && records[0];
	}
}

export default new Statistics();
