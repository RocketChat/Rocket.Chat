import { Meteor } from 'meteor/meteor';
import { LivechatCustomField } from '/app/models';

Meteor.methods({
	'livechat:getCustomFields'() {
		return LivechatCustomField.find().fetch();
	},
});
