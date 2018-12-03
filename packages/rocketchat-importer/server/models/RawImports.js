import { RocketChat } from 'meteor/rocketchat:lib';

class RawImportsModel extends RocketChat.models._Base {
	constructor() {
		super('raw_imports');
	}
}

export const RawImports = new RawImportsModel();
