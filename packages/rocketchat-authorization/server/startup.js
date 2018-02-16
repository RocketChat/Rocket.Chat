/* eslint no-multi-spaces: 0 */

Meteor.startup(function() {
	// Note:
	// 1.if we need to create a role that can only edit channel message, but not edit group message
	// then we can define edit-<type>-message instead of edit-message
	// 2. admin, moderator, and user roles should not be deleted as they are referened in the code.
	const permissions = [
		{ _id: 'access-permissions',            roles : ['admin'] },
		{ _id: 'add-oauth-service',             roles : ['admin'] },
		{ _id: 'add-user-to-joined-room',       roles : ['admin', 'owner', 'moderator'] },
		{ _id: 'add-user-to-any-c-room',        roles : ['admin'] },
		{ _id: 'add-user-to-any-p-room',        roles : [] },
		{ _id: 'archive-room',                  roles : ['admin', 'owner'] },
		{ _id: 'assign-admin-role',             roles : ['admin'] },
		{ _id: 'ban-user',                      roles : ['admin', 'owner', 'moderator'] },
		{ _id: 'bulk-create-c',                 roles : ['admin'] },
		{ _id: 'bulk-register-user',            roles : ['admin'] },
		{ _id: 'create-c',                      roles : ['admin', 'user', 'bot'] },
		{ _id: 'create-d',                      roles : ['admin', 'user', 'bot'] },
		{ _id: 'create-p',                      roles : ['admin', 'user', 'bot'] },
		{ _id: 'create-user',                   roles : ['admin'] },
		{ _id: 'clean-channel-history',         roles : ['admin'] }, // special permission to bulk delete a channel's mesages
		{ _id: 'delete-c',                      roles : ['admin'] },
		{ _id: 'delete-d',                      roles : ['admin'] },
		{ _id: 'delete-message',                roles : ['admin', 'owner', 'moderator'] },
		{ _id: 'delete-p',                      roles : ['admin'] },
		{ _id: 'delete-user',                   roles : ['admin'] },
		{ _id: 'edit-message',                  roles : ['admin', 'owner', 'moderator'] },
		{ _id: 'edit-other-user-active-status', roles : ['admin'] },
		{ _id: 'edit-other-user-info',          roles : ['admin'] },
		{ _id: 'edit-other-user-password',      roles : ['admin'] },
		{ _id: 'edit-privileged-setting',       roles : ['admin'] },
		{ _id: 'edit-room',                     roles : ['admin', 'owner', 'moderator'] },
		{ _id: 'force-delete-message',          roles : ['admin', 'owner'] },
		{ _id: 'join-without-join-code',        roles : ['admin', 'bot'] },
		{ _id: 'manage-assets',                 roles : ['admin'] },
		{ _id: 'manage-emoji',                  roles : ['admin'] },
		{ _id: 'manage-integrations',           roles : ['admin'] },
		{ _id: 'manage-own-integrations',       roles : ['admin', 'bot'] },
		{ _id: 'manage-oauth-apps',             roles : ['admin'] },
		{ _id: 'mention-all',                   roles : ['admin', 'owner', 'moderator', 'user'] },
		{ _id: 'mention-here',                  roles : ['admin', 'owner', 'moderator', 'user'] },
		{ _id: 'mute-user',                     roles : ['admin', 'owner', 'moderator'] },
		{ _id: 'remove-user',                   roles : ['admin', 'owner', 'moderator'] },
		{ _id: 'run-import',                    roles : ['admin'] },
		{ _id: 'run-migration',                 roles : ['admin'] },
		{ _id: 'set-moderator',                 roles : ['admin', 'owner'] },
		{ _id: 'set-owner',                     roles : ['admin', 'owner'] },
		{ _id: 'send-many-messages',            roles : ['admin', 'bot'] },
		{ _id: 'set-leader',                    roles : ['admin', 'owner'] },
		{ _id: 'unarchive-room',                roles : ['admin'] },
		{ _id: 'view-c-room',                   roles : ['admin', 'user', 'bot', 'anonymous'] },
		{ _id: 'user-generate-access-token',    roles : ['admin'] },
		{ _id: 'view-d-room',                   roles : ['admin', 'user', 'bot'] },
		{ _id: 'view-full-other-user-info',     roles : ['admin'] },
		{ _id: 'view-history',                  roles : ['admin', 'user', 'anonymous'] },
		{ _id: 'view-joined-room',              roles : ['guest', 'bot', 'anonymous'] },
		{ _id: 'view-join-code',                roles : ['admin'] },
		{ _id: 'view-logs',                     roles : ['admin'] },
		{ _id: 'view-other-user-channels',      roles : ['admin'] },
		{ _id: 'view-p-room',                   roles : ['admin', 'user', 'anonymous'] },
		{ _id: 'view-privileged-setting',       roles : ['admin'] },
		{ _id: 'view-room-administration',      roles : ['admin'] },
		{ _id: 'view-statistics',               roles : ['admin'] },
		{ _id: 'view-user-administration',      roles : ['admin'] },
		{ _id: 'preview-c-room',                roles : ['admin', 'user', 'anonymous'] },
		{ _id: 'view-outside-room',             roles : ['admin', 'owner', 'moderator', 'user'] }
	];

	for (const permission of permissions) {
		if (!RocketChat.models.Permissions.findOneById(permission._id)) {
			RocketChat.models.Permissions.upsert(permission._id, {$set: permission });
		}
	}

	const defaultRoles = [
		{ name: 'admin',     scope: 'Users',         description: 'Admin' },
		{ name: 'moderator', scope: 'Subscriptions', description: 'Moderator' },
		{ name: 'leader',    scope: 'Subscriptions', description: 'Leader' },
		{ name: 'owner',     scope: 'Subscriptions', description: 'Owner' },
		{ name: 'user',      scope: 'Users',         description: '' },
		{ name: 'bot',       scope: 'Users',         description: '' },
		{ name: 'guest',     scope: 'Users',         description: '' },
		{ name: 'anonymous', scope: 'Users',         description: '' }
	];

	for (const role of defaultRoles) {
		RocketChat.models.Roles.upsert({ _id: role.name }, { $setOnInsert: { scope: role.scope, description: role.description || '', protected: true, mandatory2fa: false } });
	}
});
