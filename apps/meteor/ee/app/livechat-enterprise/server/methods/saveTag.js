import { Meteor } from 'meteor/meteor';

import { hasPermission } from '../../../../../app/authorization';
import { LivechatEnterprise } from '../lib/LivechatEnterprise';

Meteor.methods({
	'livechat:saveTag'(_id, tagData, tagDepartments) {
		if (!Meteor.userId() || !hasPermission(Meteor.userId(), 'manage-livechat-tags')) {
			throw new Meteor.Error('error-not-allowed', 'Not allowed', { method: 'livechat:saveTags' });
		}

		return LivechatEnterprise.saveTag(_id, tagData, tagDepartments);
	},
});
