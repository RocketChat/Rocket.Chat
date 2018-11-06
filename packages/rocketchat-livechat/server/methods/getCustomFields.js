import { Meteor } from 'meteor/meteor';

Meteor.methods({
	'livechat:getCustomFields'() {
		return RocketChat.models.LivechatCustomField.find().fetch();
	},
});
