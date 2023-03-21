import { Meteor } from 'meteor/meteor';
import { check } from 'meteor/check';

import { hasPermissionAsync } from '../../../authorization/server/functions/hasPermission';
import { methodDeprecationLogger } from '../../../lib/server/lib/deprecationWarningLogger';
import { DepartmentHelper } from '../lib/Departments';

Meteor.methods({
	async 'livechat:removeDepartment'(_id) {
		methodDeprecationLogger.warn('livechat:removeDepartment will be deprecated in future versions of Rocket.Chat');

		check(_id, String);

		if (!Meteor.userId() || !(await hasPermissionAsync(Meteor.userId(), 'manage-livechat-departments'))) {
			throw new Meteor.Error('error-not-allowed', 'Not allowed', {
				method: 'livechat:removeDepartment',
			});
		}

		return DepartmentHelper.removeDepartment(_id);
	},
});
