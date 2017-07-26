
RocketChat.models.OEmbedCache = new class extends RocketChat.models._Base {
	constructor() {
		super('oembed_cache');
		this.tryEnsureIndex({ 'updatedAt': 1 });
	}

	//FIND ONE
	findOneById(_id, options) {
		const query = {
			_id
		};
		return this.findOne(query, options);
	}

	//INSERT
	createWithIdAndData(_id, data) {
		const record = {
			_id,
			data,
			updatedAt: new Date
		};
		record._id = this.insert(record);
		return record;
	}

	//REMOVE
	removeAfterDate(date) {
		const query = {
			updatedAt: {
				$lte: date
			}
		};
		return this.remove(query);
	}
};


