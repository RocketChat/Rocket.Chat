import { Meteor } from 'meteor/meteor';

import { hasPermission } from '../../../../../app/authorization';
import { LivechatEnterprise } from '../lib/LivechatEnterprise';

Meteor.methods({
	'livechat:removeTag'(id) {
		if (!Meteor.userId() || !hasPermission(Meteor.userId(), 'manage-livechat-tags')) {
			throw new Meteor.Error('error-not-allowed', 'Not allowed', { method: 'livechat:removeTag' });
		}

		return LivechatEnterprise.removeTag(id);
	},
});
