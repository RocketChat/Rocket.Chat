import { Meteor } from 'meteor/meteor';
import { RocketChat } from 'meteor/rocketchat:lib';

Meteor.methods({
	'livechat:getCustomFields'() {
		return RocketChat.models.LivechatCustomField.find().fetch();
	},
});
