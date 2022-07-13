import { Meteor } from 'meteor/meteor';

import { LivechatCustomField } from '../../../models/server';

Meteor.methods({
	'livechat:getCustomFields'() {
		return LivechatCustomField.find().fetch();
	},
});
