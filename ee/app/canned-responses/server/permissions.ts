import { Meteor } from 'meteor/meteor';

import { Permissions } from '../../../../app/models/server/raw';

Meteor.startup(() => {
	Permissions.create('view-canned-responses', ['livechat-agent', 'livechat-monitor', 'livechat-manager', 'admin']);
	Permissions.create('view-all-canned-responses', ['livechat-manager', 'admin']);
	Permissions.create('view-agent-canned-responses', ['livechat-agent']);
	Permissions.create('save-canned-responses', ['livechat-agent', 'livechat-monitor', 'livechat-manager', 'admin']);
	Permissions.create('save-all-canned-responses', ['livechat-manager', 'admin']);
	Permissions.create('save-department-canned-responses', ['livechat-monitor']);
	Permissions.create('remove-canned-responses', ['livechat-agent', 'livechat-monitor', 'livechat-manager', 'admin']);
});
