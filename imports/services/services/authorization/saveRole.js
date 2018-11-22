import { Meteor } from 'meteor/meteor';
import { RocketChat } from 'meteor/rocketchat:lib';

export default {
	saveRole: {
		params: {
			uid: 'string',
			name: 'string',
			scope: 'string',
			description: 'string',
		},
		async handler(ctx) {
			const { uid, name, description } = ctx.params;
			let { scope } = ctx.params;

			if (!uid || !(await ctx.call('hasPermission', { uid, permission: 'access-permissions' }))) {
				throw new Meteor.Error('error-action-not-allowed', 'Accessing permissions is not allowed', {
					method: 'authorization:saveRole',
					action: 'Accessing_permissions',
				});
			}

			if (!name) {
				throw new Meteor.Error('error-role-name-required', 'Role name is required', {
					method: 'authorization:saveRole',
				});
			}

			if (['Users', 'Subscriptions'].includes(scope) === false) {
				scope = 'Users';
			}

			const update = RocketChat.models.Roles.createOrUpdate(name, scope, description);
			if (RocketChat.settings.get('UI_DisplayRoles')) { // TODO remove after hub
				RocketChat.Notifications.notifyLogged('roles-change', {
					type: 'changed',
					_id: name,
				});
			}

			return update;
		},
	},
};
