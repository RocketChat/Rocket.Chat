import { Meteor } from 'meteor/meteor';
import _ from 'underscore';

import { Roles, Permissions } from '../../models';

Meteor.startup(() => {
	const roles = _.pluck(Roles.find().fetch(), 'name');
	if (roles.indexOf('livechat-agent') === -1) {
		Roles.createOrUpdate('livechat-agent');
	}
	if (roles.indexOf('livechat-manager') === -1) {
		Roles.createOrUpdate('livechat-manager');
	}
	if (roles.indexOf('livechat-guest') === -1) {
		Roles.createOrUpdate('livechat-guest');
	}
	if (Permissions) {
		Permissions.createIfNotExists('view-l-room', ['livechat-agent', 'livechat-manager', 'admin']);
		Permissions.createIfNotExists('view-livechat-manager', ['livechat-manager', 'admin']);
		Permissions.createIfNotExists('view-livechat-rooms', ['livechat-manager', 'admin']);
		Permissions.createIfNotExists('close-livechat-room', ['livechat-agent', 'livechat-manager', 'admin']);
		Permissions.createIfNotExists('close-others-livechat-room', ['livechat-manager', 'admin']);
		Permissions.createIfNotExists('save-others-livechat-room-info', ['livechat-manager']);
		Permissions.createIfNotExists('remove-closed-livechat-rooms', ['livechat-manager', 'admin']);
		Permissions.createIfNotExists('view-livechat-analytics', ['livechat-manager', 'admin']);
		Permissions.createIfNotExists('view-livechat-queue', ['livechat-manager', 'admin']);
		Permissions.createIfNotExists('transfer-livechat-guest', ['livechat-manager', 'admin']);
		Permissions.createIfNotExists('manage-livechat-managers', ['livechat-manager', 'admin']);
		Permissions.createIfNotExists('manage-livechat-agents', ['livechat-manager', 'admin']);
		Permissions.createIfNotExists('manage-livechat-departments', ['livechat-manager', 'admin']);
		Permissions.createIfNotExists('view-livechat-departments', ['livechat-manager', 'admin']);
		Permissions.createIfNotExists('add-livechat-department-agents', ['livechat-manager', 'admin']);
		Permissions.createIfNotExists('view-livechat-current-chats', ['livechat-manager', 'admin']);
		Permissions.createIfNotExists('view-livechat-real-time-monitoring', ['livechat-manager', 'admin']);
		Permissions.createIfNotExists('view-livechat-triggers', ['livechat-manager', 'admin']);
		Permissions.createIfNotExists('view-livechat-customfields', ['livechat-manager', 'admin']);
		Permissions.createIfNotExists('view-livechat-installation', ['livechat-manager', 'admin']);
		Permissions.createIfNotExists('view-livechat-appearance', ['livechat-manager', 'admin']);
		Permissions.createIfNotExists('view-livechat-webhooks', ['livechat-manager', 'admin']);
		Permissions.createIfNotExists('view-livechat-facebook', ['livechat-manager', 'admin']);
		Permissions.createIfNotExists('view-livechat-officeHours', ['livechat-manager', 'admin']);
	}
});
