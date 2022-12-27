import { Meteor } from 'meteor/meteor';
import { check } from 'meteor/check';

import { hasPermission } from '../../../authorization';
import { methodDeprecationLogger } from '../../../lib/server/lib/deprecationWarningLogger';
import { DepartmentHelper } from '../lib/DepartmentsHelper';

Meteor.methods({
	'livechat:removeDepartment'(_id) {
		methodDeprecationLogger.warn('livechat:removeDepartment will be deprecated in future versions of Rocket.Chat');

		check(_id, String);

		if (!Meteor.userId() || !hasPermission(Meteor.userId(), 'manage-livechat-departments')) {
			throw new Meteor.Error('error-not-allowed', 'Not allowed', {
				method: 'livechat:removeDepartment',
			});
		}

		return DepartmentHelper.removeDepartment(_id);
	},
});
