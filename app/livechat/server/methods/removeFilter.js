import { Meteor } from 'meteor/meteor';
import { check } from 'meteor/check';

import { hasPermission } from '../../../authorization';
import { LivechatFilter } from '../../../models';

Meteor.methods({
	'livechat:removeFilter'(filterId) {
		if (!Meteor.userId() || !hasPermission(Meteor.userId(), 'view-livechat-manager')) {
			throw new Meteor.Error('error-not-allowed', 'Not allowed', { method: 'livechat:removeFilter' });
		}

		check(filterId, String);

		return LivechatFilter.removeById(filterId);
	},
});
