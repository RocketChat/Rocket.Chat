import { Meteor } from 'meteor/meteor';

import { hasPermission } from '../../../authorization';
import { Livechat } from '../lib/Livechat';

Meteor.methods({
	'livechat:removeDepartment'(_id) {
		if (!Meteor.userId() || !hasPermission(Meteor.userId(), 'manage-livechat-departments')) {
			throw new Meteor.Error('error-not-allowed', 'Not allowed', {
				method: 'livechat:removeDepartment',
			});
		}

		return Livechat.removeDepartment(_id);
	},
});
