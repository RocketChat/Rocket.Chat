import { Meteor } from 'meteor/meteor';
import s from 'underscore.string';

import { hasPermission } from '../../../../authorization';
import { MentionGroups } from '../../../../models';

Meteor.publish('mentionGroups', function(filter, limit) {
	if (!this.userId) {
		return this.ready();
	}
	if (!hasPermission(this.userId, 'manage-mention-groups')) {
		this.error(Meteor.Error('error-not-allowed', 'Not allowed', { publish: 'mentionGroups' }));
	}

	let query = {};
	if (filter) {
		const filterReg = new RegExp(s.escapeRegExp(filter), 'i');
		query = { name: filterReg };
	}

	return MentionGroups.find(query, { limit, sort: { default: -1, name: 1 } });
});
