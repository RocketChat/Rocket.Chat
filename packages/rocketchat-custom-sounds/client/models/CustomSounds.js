import { RocketChat } from 'meteor/rocketchat:lib';

class CustomSounds extends RocketChat.models._Base {
	constructor() {
		super();
		this._initModel('custom_sounds');
	}
}

RocketChat.models.CustomSounds = new CustomSounds();
