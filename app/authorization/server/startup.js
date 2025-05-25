/* eslint no-multi-spaces: 0 */
import { Meteor } from 'meteor/meteor';

import { Roles, Permissions, Settings } from '../../models/server';
import { settings } from '../../settings/server';
import { getSettingPermissionId, CONSTANTS } from '../lib';
import { clearCache } from './functions/hasPermission';
import { redisMessageHandlers } from '/app/redis/handleRedisMessage';

Meteor.startup(function () {
	// Note:
	// 1.if we need to create a role that can only edit channel message, but not edit group message
	// then we can define edit-<type>-message instead of edit-message
	// 2. admin, moderator, and user roles should not be deleted as they are referened in the code.
	const permissions = [
		{ _id: 'access-permissions', roles: ['admin'] },
		{ _id: 'access-setting-permissions', roles: ['admin'] },
		{ _id: 'add-oauth-service', roles: ['admin'] },
		{ _id: 'add-user-to-joined-room', roles: ['admin', 'owner', 'moderator'] },
		{ _id: 'add-user-to-any-c-room', roles: ['admin'] },
		{ _id: 'add-user-to-any-p-room', roles: [] },
		{ _id: 'api-bypass-rate-limit', roles: ['admin', 'bot', 'app'] },
		{ _id: 'archive-room', roles: ['admin', 'owner'] },
		{ _id: 'assign-admin-role', roles: ['admin'] },
		{ _id: 'assign-roles', roles: ['admin'] },
		{ _id: 'ban-user', roles: ['admin', 'owner', 'moderator'] },
		{ _id: 'bulk-register-user', roles: ['admin'] },
		{ _id: 'create-c', roles: ['admin', 'user', 'bot', 'app'] },
		{ _id: 'create-d', roles: ['admin', 'user', 'bot', 'app'] },
		{ _id: 'create-p', roles: ['admin', 'user', 'bot', 'app'] },
		{ _id: 'create-personal-access-tokens', roles: ['admin', 'user'] },
		{ _id: 'create-user', roles: ['admin'] },
		{ _id: 'clean-channel-history', roles: ['admin'] },
		{ _id: 'delete-c', roles: ['admin', 'owner'] },
		{ _id: 'delete-d', roles: ['admin'] },
		{ _id: 'delete-message', roles: ['admin', 'owner', 'moderator'] },
		{ _id: 'delete-own-message', roles: ['admin', 'user'] },
		{ _id: 'delete-p', roles: ['admin', 'owner'] },
		{ _id: 'delete-user', roles: ['admin'] },
		{ _id: 'edit-message', roles: ['admin', 'owner', 'moderator'] },
		{ _id: 'edit-other-user-active-status', roles: ['admin'] },
		{ _id: 'edit-other-user-info', roles: ['admin'] },
		{ _id: 'edit-other-user-password', roles: ['admin'] },
		{ _id: 'edit-other-user-avatar', roles: ['admin'] },
		{ _id: 'edit-privileged-setting', roles: ['admin'] },
		{ _id: 'edit-room', roles: ['admin', 'owner', 'moderator'] },
		{ _id: 'edit-room-retention-policy', roles: ['admin'] },
		{ _id: 'force-delete-message', roles: ['admin', 'owner'] },
		{ _id: 'join-without-join-code', roles: ['admin', 'bot', 'app'] },
		{ _id: 'leave-c', roles: ['admin', 'user', 'bot', 'anonymous', 'app'] },
		{ _id: 'leave-p', roles: ['admin', 'user', 'bot', 'anonymous', 'app'] },
		{ _id: 'manage-assets', roles: ['admin'] },
		{ _id: 'manage-emoji', roles: ['admin'] },
		{ _id: 'manage-user-status', roles: ['admin'] },
		{ _id: 'manage-outgoing-integrations', roles: ['admin'] },
		{ _id: 'manage-incoming-integrations', roles: ['admin'] },
		{ _id: 'manage-own-outgoing-integrations', roles: ['admin'] },
		{ _id: 'manage-own-incoming-integrations', roles: ['admin'] },
		{ _id: 'manage-oauth-apps', roles: ['admin'] },
		{ _id: 'manage-selected-settings', roles: ['admin'] },
		{ _id: 'mention-all', roles: ['admin', 'owner', 'moderator', 'user'] },
		{ _id: 'mention-here', roles: ['admin', 'owner', 'moderator', 'user'] },
		{ _id: 'mute-user', roles: ['admin', 'owner', 'moderator'] },
		{ _id: 'remove-user', roles: ['admin', 'owner', 'moderator'] },
		{ _id: 'run-import', roles: ['admin'] },
		{ _id: 'run-migration', roles: ['admin'] },
		{ _id: 'set-moderator', roles: ['admin', 'owner'] },
		{ _id: 'set-owner', roles: ['admin', 'owner'] },
		{ _id: 'send-many-messages', roles: ['admin', 'bot', 'app'] },
		{ _id: 'set-leader', roles: ['admin', 'owner'] },
		{ _id: 'unarchive-room', roles: ['admin'] },
		{ _id: 'view-c-room', roles: ['admin', 'user', 'bot', 'app', 'anonymous'] },
		{ _id: 'user-generate-access-token', roles: ['admin'] },
		{ _id: 'view-d-room', roles: ['admin', 'user', 'bot', 'app', 'guest'] },
		{ _id: 'view-full-other-user-info', roles: ['admin'] },
		{ _id: 'view-history', roles: ['admin', 'user', 'anonymous'] },
		{ _id: 'view-joined-room', roles: ['guest', 'bot', 'app', 'anonymous'] },
		{ _id: 'view-join-code', roles: ['admin'] },
		{ _id: 'view-logs', roles: ['admin'] },
		{ _id: 'view-other-user-channels', roles: ['admin'] },
		{ _id: 'view-p-room', roles: ['admin', 'user', 'anonymous', 'guest'] },
		{ _id: 'view-privileged-setting', roles: ['admin'] },
		{ _id: 'view-room-administration', roles: ['admin'] },
		{ _id: 'view-statistics', roles: ['admin'] },
		{ _id: 'view-user-administration', roles: ['admin'] },
		{ _id: 'preview-c-room', roles: ['admin', 'user', 'anonymous'] },
		{
			_id: 'view-outside-room',
			roles: ['admin', 'owner', 'moderator', 'user'],
		},
		{
			_id: 'view-broadcast-member-list',
			roles: ['admin', 'owner', 'moderator'],
		},
		{ _id: 'call-management', roles: ['admin', 'owner', 'moderator'] },
		{ _id: 'create-invite-links', roles: ['admin', 'owner', 'moderator'] },
		{
			_id: 'view-l-room',
			roles: ['livechat-agent', 'livechat-manager', 'admin'],
		},
		{ _id: 'view-livechat-manager', roles: ['livechat-manager', 'admin'] },
		{ _id: 'view-livechat-rooms', roles: ['livechat-manager', 'admin'] },
		{
			_id: 'close-livechat-room',
			roles: ['livechat-agent', 'livechat-manager', 'admin'],
		},
		{ _id: 'close-others-livechat-room', roles: ['livechat-manager', 'admin'] },
		{ _id: 'save-others-livechat-room-info', roles: ['livechat-manager'] },
		{
			_id: 'remove-closed-livechat-rooms',
			roles: ['livechat-manager', 'admin'],
		},
		{ _id: 'view-livechat-analytics', roles: ['livechat-manager', 'admin'] },
		{ _id: 'view-livechat-queue', roles: ['livechat-manager', 'admin'] },
		{ _id: 'transfer-livechat-guest', roles: ['livechat-manager', 'admin'] },
		{ _id: 'manage-livechat-managers', roles: ['livechat-manager', 'admin'] },
		{ _id: 'manage-livechat-agents', roles: ['livechat-manager', 'admin'] },
		{
			_id: 'manage-livechat-departments',
			roles: ['livechat-manager', 'admin'],
		},
		{ _id: 'view-livechat-departments', roles: ['livechat-manager', 'admin'] },
		{
			_id: 'add-livechat-department-agents',
			roles: ['livechat-manager', 'admin'],
		},
		{
			_id: 'view-livechat-current-chats',
			roles: ['livechat-manager', 'admin'],
		},
		{
			_id: 'view-livechat-real-time-monitoring',
			roles: ['livechat-manager', 'admin'],
		},
		{ _id: 'view-livechat-triggers', roles: ['livechat-manager', 'admin'] },
		{ _id: 'view-livechat-customfields', roles: ['livechat-manager', 'admin'] },
		{ _id: 'view-livechat-installation', roles: ['livechat-manager', 'admin'] },
		{ _id: 'view-livechat-appearance', roles: ['livechat-manager', 'admin'] },
		{ _id: 'view-livechat-webhooks', roles: ['livechat-manager', 'admin'] },
		{ _id: 'view-livechat-facebook', roles: ['livechat-manager', 'admin'] },
		{
			_id: 'view-livechat-business-hours',
			roles: ['livechat-manager', 'admin'],
		},
		{
			_id: 'view-livechat-room-closed-same-department',
			roles: ['livechat-manager', 'admin'],
		},
		{
			_id: 'view-livechat-room-closed-by-another-agent',
			roles: ['livechat-manager', 'admin'],
		},
		{
			_id: 'view-livechat-room-customfields',
			roles: ['livechat-manager', 'livechat-agent', 'admin'],
		},
		{
			_id: 'edit-livechat-room-customfields',
			roles: ['livechat-manager', 'livechat-agent', 'admin'],
		},
		{
			_id: 'send-omnichannel-chat-transcript',
			roles: ['livechat-manager', 'admin'],
		},
	];

	for (const permission of permissions) {
		Permissions.create(permission._id, permission.roles);
	}

	const defaultRoles = [
		{ name: 'admin', scope: 'Users', description: 'Admin' },
		{ name: 'moderator', scope: 'Subscriptions', description: 'Moderator' },
		{ name: 'leader', scope: 'Subscriptions', description: 'Leader' },
		{ name: 'owner', scope: 'Subscriptions', description: 'Owner' },
		{ name: 'user', scope: 'Users', description: '' },
		{ name: 'bot', scope: 'Users', description: '' },
		{ name: 'app', scope: 'Users', description: '' },
		{ name: 'guest', scope: 'Users', description: '' },
		{ name: 'anonymous', scope: 'Users', description: '' },
		{ name: 'livechat-agent', scope: 'Users', description: 'Livechat Agent' },
		{
			name: 'livechat-manager',
			scope: 'Users',
			description: 'Livechat Manager',
		},
	];

	for (const role of defaultRoles) {
		Roles.createOrUpdate(role.name, role.scope, role.description, true, false);
	}

	const getPreviousPermissions = function (settingId) {
		const previousSettingPermissions = {};

		const selector = { level: CONSTANTS.SETTINGS_LEVEL };
		if (settingId) {
			selector.settingId = settingId;
		}

		Permissions.find(selector)
			.fetch()
			.forEach(function (permission) {
				previousSettingPermissions[permission._id] = permission;
			});
		return previousSettingPermissions;
	};

	const createSettingPermission = function (
		setting,
		previousSettingPermissions
	) {
		const permissionId = getSettingPermissionId(setting._id);
		const permission = {
			level: CONSTANTS.SETTINGS_LEVEL,
			// copy those setting-properties which are needed to properly publish the setting-based permissions
			settingId: setting._id,
			group: setting.group,
			section: setting.section,
			sorter: setting.sorter,
			roles: [],
		};
		// copy previously assigned roles if available
		if (
			previousSettingPermissions[permissionId] &&
			previousSettingPermissions[permissionId].roles
		) {
			permission.roles = previousSettingPermissions[permissionId].roles;
		}
		if (setting.group) {
			permission.groupPermissionId = getSettingPermissionId(setting.group);
		}
		if (setting.section) {
			permission.sectionPermissionId = getSettingPermissionId(setting.section);
		}

		const existent = Permissions.findOne(
			{
				_id: permissionId,
				...permission,
			},
			{ fields: { _id: 1 } }
		);

		if (!existent) {
			Permissions.upsert({ _id: permissionId }, { $set: permission });
		}

		delete previousSettingPermissions[permissionId];
	};

	const createPermissionsForExistingSettings = function () {
		const previousSettingPermissions = getPreviousPermissions();

		Settings.findNotHidden()
			.fetch()
			.forEach((setting) => {
				createSettingPermission(setting, previousSettingPermissions);
			});

		// remove permissions for non-existent settings
		for (const obsoletePermission in previousSettingPermissions) {
			if (previousSettingPermissions.hasOwnProperty(obsoletePermission)) {
				Permissions.remove({ _id: obsoletePermission });
			}
		}
	};

	// for each setting which already exists, create a permission to allow changing just this one setting
	createPermissionsForExistingSettings();

	// register a callback for settings for be create in higher-level-packages
	const createPermissionForAddedSetting = function (settingId) {
		const previousSettingPermissions = getPreviousPermissions(settingId);
		const setting = Settings.findOneById(settingId);
		if (setting) {
			if (!setting.hidden) {
				createSettingPermission(setting, previousSettingPermissions);
			}
		}
	};

	settings.onload('*', createPermissionForAddedSetting);

	const handleRoles = (diff) => {
		if (diff && Object.keys(diff).length === 1 && diff._updatedAt) {
			// avoid useless changes
			return;
		}
		clearCache();
	};

	const handleRolesRedis = (data) => handleRole(data.diff);

	if (settings.get('Use_Oplog_As_Real_Time')) {
		Roles.on('change', ({ diff }) => {
			handleRoles(diff);
		});
	} else {
		Roles.on('change', ({ diff }) => {
			const newdata = {
				...diff,
				ns: 'rocketchat_roles',
			};
			// publishToRedis(`all`, newdata);
		});
	}
	redisMessageHandlers['rocketchat_roles'] = handleRolesRedis;
});
