import { Meteor } from 'meteor/meteor';

import { Permissions } from '../../../../app/models';

Meteor.startup(() => {
	if (Permissions) {
		Permissions.create('view-canned-responses', ['livechat-agent', 'livechat-monitor', 'livechat-manager', 'admin']);
		Permissions.create('save-canned-responses', ['livechat-agent', 'livechat-monitor', 'livechat-manager', 'admin']);
		Permissions.create('remove-canned-responses', ['livechat-agent', 'livechat-monitor', 'livechat-manager', 'admin']);
	}
});
