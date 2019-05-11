import { Base } from './_Base';

class CustomSounds extends Base {
	constructor() {
		super('custom_sounds');

		this.tryEnsureIndex({ name: 1 });
	}

	// find one
	findOneById(_id, options) {
		return this.findOne(_id, options);
	}

	// find
	findByName(name, options) {
		const query = {
			name,
		};

		return this.find(query, options);
	}

	findByNameExceptId(name, except, options) {
		const query = {
			_id: { $nin: [except] },
			name,
		};

		return this.find(query, options);
	}

	// update
	setName(_id, name) {
		const update = {
			$set: {
				name,
			},
		};

		return this.update({ _id }, update);
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

export default new CustomSounds();
