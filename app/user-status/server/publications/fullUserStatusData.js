import s from 'underscore.string';
import { Meteor } from 'meteor/meteor';

import { CustomUserStatus } from '../../../models';

Meteor.publish('fullUserStatusData', function(filter, limit) {
	if (!this.userId) {
		return this.ready();
	}

	const fields = {
		name: 1,
		statusType: 1,
	};

	filter = s.trim(filter);

	const options = {
		fields,
		limit,
		sort: { name: 1 },
	};

	if (filter) {
		const filterReg = new RegExp(s.escapeRegExp(filter), 'i');
		return CustomUserStatus.findByName(filterReg, options);
	}

	return CustomUserStatus.find({}, options);
});
