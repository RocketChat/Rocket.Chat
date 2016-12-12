class EmojiCustom extends RocketChat.models._Base {
	constructor() {
		super();
		this._initModel('custom_emoji');
	}
}

RocketChat.models.EmojiCustom = new EmojiCustom();
