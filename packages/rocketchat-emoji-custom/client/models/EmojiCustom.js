class EmojiCustom extends RocketChat.models._Base {
	constructor() {
		super();
		this._initModel('custom_emoji');
	}

	//find
	findByNameOrAlias(name, options) {
		const query = {
			$or: [
				{name},
				{aliases: name}
			]
		};

		return this.find(query, options);
	}
}

RocketChat.models.EmojiCustom = new EmojiCustom();
