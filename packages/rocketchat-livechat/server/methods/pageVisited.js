import { Meteor } from 'meteor/meteor';
import { RocketChat } from 'meteor/rocketchat:lib';

Meteor.methods({
	'livechat:pageVisited'(token, room, pageInfo) {
		RocketChat.Livechat.savePageHistory(token, room, pageInfo);
	},
});
