import { RocketChat } from 'meteor/rocketchat:lib';

RocketChat.smarsh.History = new class extends RocketChat.models._Base {
	constructor() {
		super('smarsh_history');
	}
};
