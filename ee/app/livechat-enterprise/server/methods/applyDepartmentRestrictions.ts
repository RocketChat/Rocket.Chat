import { Meteor } from 'meteor/meteor';

import { hasRole } from '../../../../../app/authorization/server';
import { addQueryRestrictionsToDepartmentsModel } from '../lib/query.helper';

Meteor.methods({
	'livechat:applyDepartmentRestrictions'(originalQuery = {}) {
		const user = Meteor.user();
		if (!user || !hasRole(user._id, ['livechat-monitor'])) {
			return originalQuery;
		}

		return addQueryRestrictionsToDepartmentsModel(originalQuery);
	},
});
