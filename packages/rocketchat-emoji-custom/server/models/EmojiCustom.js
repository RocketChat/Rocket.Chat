class EmojiCustom extends RocketChat.models._Base {
	constructor() {
		super('custom_emoji');

		this.tryEnsureIndex({ 'name': 1 });
		this.tryEnsureIndex({ 'aliases': 1 });
		this.tryEnsureIndex({ 'extension': 1});
	}

	//find one
	findOneByID(_id, options) {
		return this.findOne(_id, options);
	}

	//find
	findByNameOrAlias(emojiName, options) {
		let name = emojiName;

		if (typeof emojiName === 'string') {
			name = emojiName.replace(/:/g, '');
		}

		const query = {
			$or: [
				{name},
				{aliases: name}
			]
		};

		return this.find(query, options);
	}

	findByNameOrAliasExceptID(name, except, options) {
		const query = {
			_id: { $nin: [ except ] },
			$or: [
				{name},
				{aliases: name}
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

	setAliases(_id, aliases) {
		const update = {
			$set: {
				aliases
			}
		};

		return this.update({_id}, update);
	}

	setExtension(_id, extension) {
		const update = {
			$set: {
				extension
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

RocketChat.models.EmojiCustom = new EmojiCustom();
