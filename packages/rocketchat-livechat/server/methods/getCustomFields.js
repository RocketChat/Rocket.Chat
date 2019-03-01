import { Meteor } from 'meteor/meteor';
import { LivechatCustomField } from 'meteor/rocketchat:models';

Meteor.methods({
	'livechat:getCustomFields'() {
		return LivechatCustomField.find().fetch();
	},
});
