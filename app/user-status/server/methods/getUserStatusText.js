import { Meteor } from 'meteor/meteor';

import { getStatusText } from '../../../lib';

Meteor.methods({
	getUserStatusText(userId) {
		return getStatusText(userId);
	},
});
