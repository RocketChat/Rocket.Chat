
RocketChat.models.Bots = new class extends RocketChat.models._Base {
	constructor() {
		super();
		this._initModel('bot');
	}

	findOneByUsername(username, options) {
		if (typeof username === 'string') {
			username = new RegExp(`^${ username }$`, 'i');
		}

		const query = {'account.username': username};

		return this.findOne(query, options);
	}

	findOneById(userId) {
		const query =	{'account._id': userId};

		return this.findOne(query);
	}

	// FIND
	findById(userId) {
		const query = {'account._id': userId};

		return this.find(query);
	}

	findByUsername(username, options) {
		const query = {'account.username': username};

		return this.find(query, options);
	}

	findByFramework(framework, options) {
		const query = {framework};

		return this.find(query, options);
	}

	// INSERT
	createWithFullBotData(botData) {
		delete botData._id;

		botData._id = this.insert(botData);
		return botData;
	}
};
