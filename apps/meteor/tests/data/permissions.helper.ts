import type { ISetting } from '@rocket.chat/core-typings';
import { IS_EE } from '../e2e/config/constants';
import { api, credentials, request } from './api-data';
import { permissions } from '../../app/authorization/server/constant/permissions';
import { omnichannelEEPermissions } from '../../ee/app/livechat-enterprise/server/permissions';

export const updatePermission = (permission: string, roles: string[]): Promise<void | Error> =>
	new Promise((resolve, reject) => {
		request
			.post(api('permissions.update'))
			.set(credentials)
			.send({ permissions: [{ _id: permission, roles }] })
			.success()
			.end((err?: Error) => setTimeout(() => (!err && resolve()) || reject(err), 100));
	});

export const updateEEPermission = (permission: string, roles: string[]): Promise<void | Error> =>
	IS_EE ? updatePermission(permission, roles) : Promise.resolve();

export const updateManyPermissions = (permissions: { [key: string]: string[] }): Promise<void | Error> =>
	new Promise((resolve, reject) => {
		request
			.post(api('permissions.update'))
			.set(credentials)
			.send({ permissions: Object.keys(permissions).map((k) => ({ _id: k, roles: permissions[k] })) })
			.success()
			.end((err?: Error) => setTimeout(() => (!err && resolve()) || reject(err), 100));
	});

export const updateSetting = (setting: string, value: ISetting['value']): Promise<void | Error> =>
	new Promise((resolve, reject) => {
		request
			.post(`/api/v1/settings/${setting}`)
			.set(credentials)
			.send({ value })
			.success()
			.end((err?: Error) => setTimeout(() => (!err && resolve()) || reject(err), 100));
	});

export const getSettingValueById = async (setting: string): Promise<ISetting['value']> => {
	const response = await request.get(`/api/v1/settings/${setting}`).set(credentials).expect('Content-Type', 'application/json').expect(200);

	return response.body.value;
};

export const updateEESetting = (setting: string, value: ISetting['value']): Promise<void | Error> =>
	IS_EE
		? new Promise((resolve, reject) => {
				request
					.post(`/api/v1/settings/${setting}`)
					.set(credentials)
					.send({ value })
					.success()
					.end((err?: Error) => setTimeout(() => (!err && resolve()) || reject(err), 100));
		  })
		: Promise.resolve();

export const removePermissions = async (perms: string[]) => {
	await updateManyPermissions(Object.fromEntries(perms.map((name) => [name, []])));
};

export const addPermissions = async (perms: { [key: string]: string[] }) => {
	await updateManyPermissions(perms);
};

type Permission = (typeof permissions)[number]['_id'];

export const removePermissionFromAllRoles = async (permission: Permission) => {
	await updatePermission(permission, []);
};

export const restorePermissionToRoles = async (permission: Permission) => {
	const defaultPermission = getPermissions().find((p) => p._id === permission);
	if (!defaultPermission) {
		throw new Error(`No default roles found for permission ${permission}`);
	}

	const mutableDefaultRoles: string[] = defaultPermission.roles.map((r) => r);

	if (!IS_EE) {
		const eeOnlyRoles = ['livechat-monitor'];
		eeOnlyRoles.forEach((role) => {
			const index = mutableDefaultRoles.indexOf(role);
			if (index !== -1) {
				mutableDefaultRoles.splice(index, 1);
			}
		});
	}

	await updatePermission(permission, mutableDefaultRoles);
};

const getPermissions = () => {
	if (!IS_EE) {
		return permissions;
	}

	return [...permissions, ...omnichannelEEPermissions];
};
