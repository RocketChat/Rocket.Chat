RocketChat.models.LivechatTexts = new class extends RocketChat.models._Base {
	constructor() {
		super('livechat_texts');
	}

	findByNameAndLang(identifier, lang, options) {
		return this.findOne({identifier, lang}, options);
	}

	upsertByNameAndLang(identifier, lang, value) {
		const update = {
			$set: {
				text: value
			}
		};

		return this.update({identifier, lang}, update, {upsert: true});
	}
};
