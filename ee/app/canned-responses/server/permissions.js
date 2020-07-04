import { Meteor } from 'meteor/meteor';

import { Permissions } from '../../../../app/models';

Meteor.startup(() => {
	if (Permissions) {
		Permissions.createOrUpdate('view-canned-responses', ['livechat-agent', 'livechat-monitor', 'livechat-manager', 'admin']);
		Permissions.createOrUpdate('save-canned-responses', ['livechat-agent', 'livechat-monitor', 'livechat-manager', 'admin']);
		Permissions.createOrUpdate('remove-canned-responses', ['livechat-agent', 'livechat-monitor', 'livechat-manager', 'admin']);
	}
});
