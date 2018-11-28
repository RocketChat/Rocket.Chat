import { RocketChat } from 'meteor/rocketchat:lib';

class ImportsModel extends RocketChat.models._Base {
	constructor() {
		super('import');
	}
}

export const Imports = new ImportsModel();
