RocketChat.models.Statistics = new class extends RocketChat.models._Base {
	constructor() {
		super('statistics');

		this.tryEnsureIndex({ 'createdAt': 1 });
	}

	// FIND ONE
	findOneById(_id, options) {
		const query =
			{_id};

		return this.findOne(query, options);
	}

	findLast() {
		const options = {
			sort: {
				createdAt: -1
			},
			limit: 1
		};
		return this.find({}, options).fetch() && this.find({}, options).fetch()[0];
	}
};
