import { Meteor } from 'meteor/meteor';

import { LivechatCustomField } from '../../../models';

Meteor.methods({
	'livechat:getCustomFields'() {
		return LivechatCustomField.find().fetch();
	},
});
