class CustomUserStatus extends RocketChat.models._Base {
	constructor() {
		super('custom_user_status');

		this.tryEnsureIndex({ 'name': 1 });
	}

	//find one
	findOneByID(_id, options) {
		return this.findOne(_id, options);
	}

	//find
	findByName(name, options) {
		const query = {
			$or: [
				{name}
			]
		};

		return this.find(query, options);
	}

	findByNameExceptID(name, except, options) {
		const query = {
			_id: { $nin: [ except ] },
			$or: [
				{name}
			]
		};

		return this.find(query, options);
	}


	//update
	setName(_id, name) {
		const update = {
			$set: {
				name
			}
		};

		return this.update({_id}, update);
	}

	setStatusType(_id, statusType) {
		const update = {
			$set: {
				statusType
			}
		};

		return this.update({_id}, update);
	}

	// INSERT
	create(data) {
		return this.insert(data);
	}


	// REMOVE
	removeByID(_id) {
		return this.remove(_id);
	}
}

RocketChat.models.CustomUserStatus = new CustomUserStatus();
