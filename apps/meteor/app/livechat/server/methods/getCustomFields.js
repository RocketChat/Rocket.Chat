import { Meteor } from 'meteor/meteor';
import { LivechatCustomField } from '@rocket.chat/models';

Meteor.methods({
	async 'livechat:getCustomFields'() {
		return LivechatCustomField.find().toArray();
	},
});
