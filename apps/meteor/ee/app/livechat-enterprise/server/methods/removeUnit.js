import { Meteor } from 'meteor/meteor';

import { hasPermissionAsync } from '../../../../../app/authorization/server/functions/hasPermission';
import { LivechatEnterprise } from '../lib/LivechatEnterprise';

Meteor.methods({
	async 'livechat:removeUnit'(id) {
		if (!Meteor.userId() || !(await hasPermissionAsync(Meteor.userId(), 'manage-livechat-units'))) {
			throw new Meteor.Error('error-not-allowed', 'Not allowed', { method: 'livechat:removeUnit' });
		}

		return LivechatEnterprise.removeUnit(id);
	},
});
