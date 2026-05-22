/* eslint no-multi-spaces: 0 */
import type { IPermission, IRole, ISetting } from '@rocket.chat/core-typings';
import { Permissions, Roles, Settings } from '@rocket.chat/models';
import type { AnyBulkWriteOperation } from 'mongodb';
import { performance } from 'universal-perf-hooks';

import { sinceBoot } from '../../../../server/lib/logger/bootStart';
import { SystemLogger } from '../../../../server/lib/logger/system';
import { settings } from '../../../settings/server';
import { getSettingPermissionId, CONSTANTS } from '../../lib';
import { permissions } from '../constant/permissions';

export const upsertPermissions = async (): Promise<void> => {
	SystemLogger.startup({ msg: 'Initializing permissions', sinceBootMs: sinceBoot() });
	const totalStart = performance.now();

	const basePermsStart = performance.now();
	const now = new Date();
	const basePermsOps: AnyBulkWriteOperation<IPermission>[] = permissions.map((permission) => ({
		updateOne: {
			filter: { _id: permission._id },
			// $setOnInsert preserves the per-permission `Permissions.create` semantics: only seed roles when the doc is new;
			// never overwrite roles an operator has changed.
			update: { $setOnInsert: { roles: [...permission.roles], _updatedAt: now } },
			upsert: true,
		},
	}));
	if (basePermsOps.length > 0) {
		await Permissions.col.bulkWrite(basePermsOps, { ordered: false });
	}
	SystemLogger.startup({
		msg: 'Base permissions upserted',
		elapsedMs: Math.round(performance.now() - basePermsStart),
		count: permissions.length,
		sinceBootMs: sinceBoot(),
	});

	const defaultRoles = [
		{ name: 'admin', scope: 'Users', description: 'Admin' },
		{ name: 'moderator', scope: 'Subscriptions', description: 'Moderator' },
		{ name: 'leader', scope: 'Subscriptions', description: 'Leader' },
		{ name: 'owner', scope: 'Subscriptions', description: 'Owner' },
		{ name: 'user', scope: 'Users', description: '' },
		{ name: 'federated-external', scope: 'Users', description: '' },
		{ name: 'bot', scope: 'Users', description: '' },
		{ name: 'app', scope: 'Users', description: '' },
		{ name: 'guest', scope: 'Users', description: '' },
		{ name: 'anonymous', scope: 'Users', description: '' },
		{ name: 'livechat-agent', scope: 'Users', description: 'Livechat Agent' },
		{ name: 'livechat-manager', scope: 'Users', description: 'Livechat Manager' },
	] as const;

	const rolesStart = performance.now();
	const existingRoles = await Roles.col
		.find<
			Pick<IRole, '_id' | 'name' | 'scope' | 'description' | 'mandatory2fa'>
		>({ _id: { $in: defaultRoles.map((r) => r.name) } }, { projection: { _id: 1, name: 1, scope: 1, description: 1, mandatory2fa: 1 } })
		.toArray();
	const existingRolesById = new Map(existingRoles.map((r) => [r._id, r]));

	const rolesOps: AnyBulkWriteOperation<IRole>[] = defaultRoles.map((role) => {
		const existing = existingRolesById.get(role.name);
		if (existing) {
			// Match `createOrUpdateProtectedRoleAsync`: a falsy new value preserves the stored one.
			return {
				updateOne: {
					filter: { _id: role.name },
					update: {
						$set: {
							name: role.name || existing.name,
							scope: role.scope || existing.scope,
							description: role.description || existing.description,
							mandatory2fa: existing.mandatory2fa ?? false,
							_updatedAt: now,
						},
					},
				},
			};
		}
		return {
			insertOne: {
				document: {
					_id: role.name,
					name: role.name,
					scope: role.scope,
					description: role.description,
					mandatory2fa: false,
					protected: true,
					_updatedAt: now,
				} as IRole,
			},
		};
	});
	if (rolesOps.length > 0) {
		await Roles.col.bulkWrite(rolesOps, { ordered: false });
	}
	SystemLogger.startup({
		msg: 'Protected roles upserted',
		elapsedMs: Math.round(performance.now() - rolesStart),
		count: defaultRoles.length,
		sinceBootMs: sinceBoot(),
	});

	const getPreviousPermissions = async function (settingId?: string): Promise<Record<string, IPermission>> {
		const previousSettingPermissions: {
			[key: string]: IPermission;
		} = {};

		await Permissions.findByLevel('settings', settingId).forEach((permission: IPermission) => {
			previousSettingPermissions[permission._id] = permission;
		});
		return previousSettingPermissions;
	};

	const buildSettingPermission = (
		setting: ISetting,
		previousSettingPermissions: { [key: string]: IPermission },
	): { permissionId: string; permission: Omit<IPermission, '_id' | '_updatedAt'> } => {
		const permissionId = getSettingPermissionId(setting._id);
		const permission: Omit<IPermission, '_id' | '_updatedAt'> = {
			level: CONSTANTS.SETTINGS_LEVEL as 'settings' | undefined,
			// copy those setting-properties which are needed to properly publish the setting-based permissions
			settingId: setting._id,
			// TODO: migrate settings with group and section with null to undefined
			...(setting.group && { group: setting.group }),
			...(setting.section && { section: setting.section }),
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
		return { permissionId, permission };
	};

	// for each setting which already exists, create a permission to allow changing just this one setting
	const settingPermsStart = performance.now();
	const previousSettingPermissions = await getPreviousPermissions();
	const allSettings = await Settings.findNotHidden().toArray();

	const settingPermOps: AnyBulkWriteOperation<IPermission>[] = [];
	for (const setting of allSettings) {
		const { permissionId, permission } = buildSettingPermission(setting, previousSettingPermissions);
		delete previousSettingPermissions[permissionId];
		settingPermOps.push({
			updateOne: {
				filter: { _id: permissionId },
				update: { $set: { ...permission, _updatedAt: now } },
				upsert: true,
			},
		});
	}
	// remove permissions for non-existent settings
	for (const obsoletePermission of Object.keys(previousSettingPermissions)) {
		settingPermOps.push({
			deleteOne: { filter: { _id: obsoletePermission } },
		});
	}
	if (settingPermOps.length > 0) {
		await Permissions.col.bulkWrite(settingPermOps, { ordered: false });
	}
	SystemLogger.startup({
		msg: 'Setting-based permissions upserted',
		elapsedMs: Math.round(performance.now() - settingPermsStart),
		count: settingPermOps.length,
		sinceBootMs: sinceBoot(),
	});

	// register a callback for settings for be create in higher-level-packages
	settings.on('*', async ([settingId]) => {
		const previousSettingPermissions = await getPreviousPermissions(settingId);
		const setting = await Settings.findOneById(settingId);
		if (setting && !setting.hidden) {
			const { permissionId, permission } = buildSettingPermission(setting, previousSettingPermissions);
			await Permissions.updateOne({ _id: permissionId }, { $set: permission }, { upsert: true });
		}
	});

	SystemLogger.startup({
		msg: 'Permissions initialized',
		elapsedMs: Math.round(performance.now() - totalStart),
		sinceBootMs: sinceBoot(),
	});
};
