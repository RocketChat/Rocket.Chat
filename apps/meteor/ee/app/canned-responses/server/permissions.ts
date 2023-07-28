import { Permissions } from '@rocket.chat/models';
import { Meteor } from 'meteor/meteor';

Meteor.startup(async () => {
	await Permissions.create('view-canned-responses', ['livechat-agent', 'livechat-monitor', 'livechat-manager', 'admin']);
	await Permissions.create('view-all-canned-responses', ['livechat-manager', 'admin']);
	await Permissions.create('view-agent-canned-responses', ['livechat-agent']);
	await Permissions.create('save-canned-responses', ['livechat-agent', 'livechat-monitor', 'livechat-manager', 'admin']);
	await Permissions.create('save-all-canned-responses', ['livechat-manager', 'admin']);
	await Permissions.create('save-department-canned-responses', ['livechat-monitor']);
	await Permissions.create('remove-canned-responses', ['livechat-agent', 'livechat-monitor', 'livechat-manager', 'admin']);
});
