import { Meteor } from 'meteor/meteor';
import { RocketChat } from 'meteor/rocketchat:lib';
export default {
	addPermissionToRole: {
		params: {
			uid: 'string',
			role: [
				{ type: 'string' },
				{ type: 'array', items: 'string' },
			],
			scope: { type: 'string', optional: true },
		},
		handler(ctx) {
			const { uid, permission, role } = ctx.params;
			if (!uid || !RocketChat.authz.hasPermission(uid, 'access-permissions')) {
				throw new Meteor.Error('error-action-not-allowed', 'Adding permission is not allowed', {
					method: 'authorization:addPermissionToRole',
					action: 'Adding_permission',
				});
			}
			return RocketChat.models.Permissions.addRole(permission, role);
		},
	},
};
