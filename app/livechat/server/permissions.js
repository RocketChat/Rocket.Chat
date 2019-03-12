import { Meteor } from 'meteor/meteor';
import { Roles, Permissions } from 'meteor/rocketchat:models';
import _ from 'underscore';

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
		Permissions.createOrUpdate('view-l-room', ['livechat-agent', 'livechat-manager', 'admin']);
		Permissions.createOrUpdate('view-livechat-manager', ['livechat-manager', 'admin']);
		Permissions.createOrUpdate('view-livechat-rooms', ['livechat-manager', 'admin']);
		Permissions.createOrUpdate('close-livechat-room', ['livechat-agent', 'livechat-manager', 'admin']);
		Permissions.createOrUpdate('close-others-livechat-room', ['livechat-manager', 'admin']);
		Permissions.createOrUpdate('save-others-livechat-room-info', ['livechat-manager']);
		Permissions.createOrUpdate('remove-closed-livechat-rooms', ['livechat-manager', 'admin']);
		Permissions.createOrUpdate('view-livechat-analytics', ['livechat-manager', 'admin']);
	}
});
