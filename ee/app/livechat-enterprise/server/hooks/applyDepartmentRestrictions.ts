import { Meteor } from 'meteor/meteor';

import { callbacks } from '../../../../../app/callbacks/server';
import { addQueryRestrictionsToDepartmentsModel } from '../lib/query.helper';
import { hasRole } from '../../../../../app/authorization/server/functions/hasRole';

callbacks.add('livechat.applyDepartmentRestrictions', (originalQuery = {}) => {
	const user = Meteor.user();
	if (!user || !hasRole(user._id, 'livechat-monitor')) {
		return originalQuery;
	}

	return addQueryRestrictionsToDepartmentsModel(originalQuery);
}, callbacks.priority.HIGH, 'livechat-apply-department-restrictions');
