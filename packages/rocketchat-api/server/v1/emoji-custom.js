import { Meteor } from 'meteor/meteor';
import { RocketChat } from 'meteor/rocketchat:lib';

RocketChat.API.v1.addRoute('emoji-custom', { authRequired: true }, {
	get() {
		const { query } = this.parseJsonQuery();
		const emojis = Meteor.call('listEmojiCustom', query);

		return RocketChat.API.v1.success({ emojis });
	},
});
