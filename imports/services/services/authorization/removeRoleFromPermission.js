import { Meteor } from 'meteor/meteor';
import { RocketChat } from 'meteor/rocketchat:lib';

export default {
	removeRoleFromPermission: {
		params: {
			uid: 'string',
			roleName: 'string',
			permission: 'string',
		},
		async handler(ctx) {
			const { uid, roleName, permission } = ctx.params;
			if (!uid || !RocketChat.authz.hasPermission(uid, 'access-permissions')) {
				throw new Meteor.Error('error-action-not-allowed', 'Accessing permissions is not allowed', {
					method: 'authorization:removeRoleFromPermission',
					action: 'Accessing_permissions',
				});
			}
			return RocketChat.models.Permissions.removeRole(permission, roleName);
		},
	},
};
