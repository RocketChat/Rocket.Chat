class SnippetMessage extends RocketChat.models._Base {
	constructor() {
		super('snippeted_message');

		this.tryEnsureIndex({ 'name': 1 });
		this.tryEnsureIndex({ 'extension': 1});
	}

	findOneById(_id, options) {
		return this.findOne(_id, options);
	}

	findByRoomId(rid, options) {
		return this.find({rid: rid}, options);
	}

	setFileName(_id, name){
		let update = {
			$set: {
				filename: name
			}
		};
		return this.update({_id}, update);
	}
}

RocketChat.models.SnippetMessage = new SnippetMessage();
