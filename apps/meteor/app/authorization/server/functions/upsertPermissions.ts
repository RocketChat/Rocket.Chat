/* eslint no-multi-spaces: 0 */
import type { IPermission, ISetting } from '@rocket.chat/core-typings';
import { Permissions, Settings } from '@rocket.chat/models';

import { createOrUpdateProtectedRoleAsync } from '../../../../server/lib/roles/createOrUpdateProtectedRole';
import { settings } from '../../../settings/server';
import { getSettingPermissionId, CONSTANTS } from '../../lib';
import { permissions } from '../constant/permissions';

export const upsertPermissions = async (): Promise<void> => {
	for await (const permission of permissions) {
		await Permissions.create(permission._id, permission.roles);
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
		{ name: 'livechat-manager', scope: 'Users', description: 'Livechat Manager' },
	] as const;

	for await (const role of defaultRoles) {
		await createOrUpdateProtectedRoleAsync(role.name, role);
	}

	const getPreviousPermissions = async function (settingId?: string): Promise<Record<string, IPermission>> {
		const previousSettingPermissions: {
			[key: string]: IPermission;
		} = {};

		await Permissions.findByLevel('settings', settingId).forEach((permission: IPermission) => {
			previousSettingPermissions[permission._id] = permission;
		});
		return previousSettingPermissions;
	};

	const createSettingPermission = async function (
		setting: ISetting,
		previousSettingPermissions: {
			[key: string]: IPermission;
		},
	): Promise<void> {
		const permissionId = getSettingPermissionId(setting._id);
		const permission: Omit<IPermission, '_id' | '_updatedAt'> = {
			level: CONSTANTS.SETTINGS_LEVEL as 'settings' | undefined,
			// copy those setting-properties which are needed to properly publish the setting-based permissions
			settingId: setting._id,
			group: setting.group,
			section: setting.section ?? undefined,
			sorter: setting.sorter,
			roles: [],
		};
		// copy previously assigned roles if available
		if (previousSettingPermissions[permissionId]?.roles) {
			permission.roles = previousSettingPermissions[permissionId].roles;
		}
		if (setting.group) {
			permission.groupPermissionId = getSettingPermissionId(setting.group);
		}
		if (setting.section) {
			permission.sectionPermissionId = getSettingPermissionId(setting.section);
		}

		const existent = await Permissions.findOne(
			{
				_id: permissionId,
				...permission,
			},
			{ projection: { _id: 1 } },
		);

		if (!existent) {
			try {
				await Permissions.updateOne({ _id: permissionId }, { $set: permission }, { upsert: true });
			} catch (e) {
				if (!(e as Error).message.includes('E11000')) {
					// E11000 refers to a MongoDB error that can occur when using unique indexes for upserts
					// https://docs.mongodb.com/manual/reference/method/db.collection.update/#use-unique-indexes
					await Permissions.updateOne({ _id: permissionId }, { $set: permission }, { upsert: true });
				}
			}
		}

		delete previousSettingPermissions[permissionId];
	};

	const createPermissionsForExistingSettings = async function (): Promise<void> {
		const previousSettingPermissions = await getPreviousPermissions();

		const settings = await Settings.findNotHidden().toArray();
		for await (const setting of settings) {
			await createSettingPermission(setting, previousSettingPermissions);
		}

		// remove permissions for non-existent settings
		for await (const obsoletePermission of Object.keys(previousSettingPermissions)) {
			if (previousSettingPermissions.hasOwnProperty(obsoletePermission)) {
				await Permissions.deleteOne({ _id: obsoletePermission });
			}
		}
	};

	// for each setting which already exists, create a permission to allow changing just this one setting
	await createPermissionsForExistingSettings();

	// register a callback for settings for be create in higher-level-packages
	settings.on('*', async ([settingId]) => {
		const previousSettingPermissions = await getPreviousPermissions(settingId);
		const setting = await Settings.findOneById(settingId);
		if (setting && !setting.hidden) {
			await createSettingPermission(setting, previousSettingPermissions);
		}
	});
};
