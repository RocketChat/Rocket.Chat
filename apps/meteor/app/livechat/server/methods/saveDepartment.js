import { Meteor } from 'meteor/meteor';

import { hasPermissionAsync } from '../../../authorization/server/functions/hasPermission';
import { LivechatEnterprise } from '../../../../ee/app/livechat-enterprise/server/lib/LivechatEnterprise';

Meteor.methods({
	async 'livechat:saveDepartment'(_id, departmentData, departmentAgents) {
		if (!Meteor.userId() || !(await hasPermissionAsync(Meteor.userId(), 'manage-livechat-departments'))) {
			throw new Meteor.Error('error-not-allowed', 'Not allowed', {
				method: 'livechat:saveDepartment',
			});
		}

		return LivechatEnterprise.saveDepartment(_id, departmentData, { upsert: departmentAgents });
	},
});
