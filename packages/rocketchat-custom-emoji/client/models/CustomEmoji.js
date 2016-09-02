class CustomEmoji extends RocketChat.models._Base {
	constructor() {
		super();
		this._initModel('custom_emoji');
	}
}

RocketChat.models.CustomEmoji = new CustomEmoji();
