import { Meteor } from 'meteor/meteor';

import { hasPermissionAsync } from '../../../../../app/authorization/server/functions/hasPermission';
import { LivechatEnterprise } from '../lib/LivechatEnterprise';

Meteor.methods({
	async 'livechat:saveUnit'(_id, unitData, unitMonitors, unitDepartments) {
		if (!Meteor.userId() || !(await hasPermissionAsync(Meteor.userId(), 'manage-livechat-units'))) {
			throw new Meteor.Error('error-not-allowed', 'Not allowed', { method: 'livechat:saveUnit' });
		}

		return LivechatEnterprise.saveUnit(_id, unitData, unitMonitors, unitDepartments);
	},
});
