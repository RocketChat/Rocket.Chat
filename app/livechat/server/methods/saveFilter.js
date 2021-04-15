import { Meteor } from 'meteor/meteor';
import { Match, check } from 'meteor/check';

import { hasPermission } from '../../../authorization';
import { LivechatFilter } from '../../../models';

Meteor.methods({
	'livechat:saveFilter'(filter) {
		if (!Meteor.userId() || !hasPermission(Meteor.userId(), 'view-livechat-manager')) {
			throw new Meteor.Error('error-not-allowed', 'Not allowed', { method: 'livechat:saveFilter' });
		}

		check(filter, {
			_id: Match.Maybe(String),
			name: String,
			description: String,
			enabled: Boolean,
			regex: String,
			slug: String,
		});

		if (filter._id) {
			return LivechatFilter.updateById(filter._id, filter);
		}
		return LivechatFilter.insert(filter);
	},
});
