import { Meteor } from 'meteor/meteor';

import { hasPermissionAsync } from '../../../../../app/authorization/server/functions/hasPermission';
import { LivechatEnterprise } from '../lib/LivechatEnterprise';

Meteor.methods({
	async 'livechat:removeTag'(id) {
		if (!Meteor.userId() || !(await hasPermissionAsync(Meteor.userId(), 'manage-livechat-tags'))) {
			throw new Meteor.Error('error-not-allowed', 'Not allowed', { method: 'livechat:removeTag' });
		}

		return LivechatEnterprise.removeTag(id);
	},
});
