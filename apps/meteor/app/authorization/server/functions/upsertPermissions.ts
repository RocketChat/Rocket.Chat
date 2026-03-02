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
		previousSettingPermissions: Record<string, IPermission>,
	): Promise<void> {
		const { _id: permissionId, doc } = buildSettingPermissionDoc(setting, previousSettingPermissions);
		try {
			await Permissions.updateOne({ _id: permissionId }, { $set: doc }, { upsert: true });
		} catch (e) {
			if (!(e as Error).message.includes('E11000')) {
				await Permissions.updateOne({ _id: permissionId }, { $set: doc }, { upsert: true });
			}
		}
		delete previousSettingPermissions[permissionId];
	};

	const buildSettingPermissionDoc = function (
		setting: ISetting,
		previousSettingPermissions: Record<string, IPermission>,
	): { _id: string; doc: Omit<IPermission, '_id'> } {
		const permissionId = getSettingPermissionId(setting._id);
		const permission: Omit<IPermission, '_id' | '_updatedAt'> = {
			level: CONSTANTS.SETTINGS_LEVEL as 'settings' | undefined,
			settingId: setting._id,
			group: setting.group,
			section: setting.section ?? undefined,
			sorter: setting.sorter,
			roles: previousSettingPermissions[permissionId]?.roles ?? [],
		};
		if (setting.group) {
			permission.groupPermissionId = getSettingPermissionId(setting.group);
		}
		if (setting.section) {
			permission.sectionPermissionId = getSettingPermissionId(setting.section);
		}
		return { _id: permissionId, doc: { ...permission, _updatedAt: new Date() } };
	};

	const BULK_WRITE_BATCH_SIZE = 500;

	const createPermissionsForExistingSettings = async function (): Promise<void> {
		const previousSettingPermissions = await getPreviousPermissions();
		const settingsList = await Settings.findNotHidden().toArray();

		const updateOps: Array<{ updateOne: { filter: { _id: string }; update: { $set: Omit<IPermission, '_id'> }; upsert: true } } = [];
		for (const setting of settingsList) {
			const { _id: permissionId, doc } = buildSettingPermissionDoc(setting, previousSettingPermissions);
			updateOps.push({
				updateOne: {
					filter: { _id: permissionId },
					update: { $set: doc },
					upsert: true,
				},
			});
			delete previousSettingPermissions[permissionId];
		}

		for (let i = 0; i < updateOps.length; i += BULK_WRITE_BATCH_SIZE) {
			const batch = updateOps.slice(i, i + BULK_WRITE_BATCH_SIZE);
			try {
				await Permissions.col.bulkWrite(batch, { ordered: false });
			} catch (e) {
				if ((e as Error).message.includes('E11000')) {
					// E11000 duplicate key: retry without upsert for this batch (doc already exists)
					await Promise.all(
						batch.map((op) =>
							Permissions.updateOne(op.updateOne.filter, op.updateOne.update),
						),
					);
				} else {
					throw e;
				}
			}
		}

		const obsoleteIds = Object.keys(previousSettingPermissions);
		if (obsoleteIds.length > 0) {
			await Permissions.deleteMany({ _id: { $in: obsoleteIds } });
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
