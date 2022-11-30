import { ISetting } from '@rocket.chat/core-typings';
import { api, credentials, request } from './api-data';

const delay = typeof cy !== 'undefined' ? 1000 : 100;

export const updatePermission = (permission:string, roles:string[]) =>
	new Promise((resolve) => {
		request
			.post(api('permissions.update'))
			.set(credentials)
			.send({ permissions: [{ _id: permission, roles }] })
			.expect('Content-Type', 'application/json')
			.expect(200)
			.end(() => setTimeout(resolve, delay));
	});

export const updateManyPermissions = (permissions: { [key: string]: string[] }) =>
	new Promise((resolve) => {
		request
			.post(api('permissions.update'))
			.set(credentials)
			.send({ permissions: Object.keys(permissions).map((k) => ({_id: k, roles: permissions[k] }))})
			.expect('Content-Type', 'application/json')
			.expect(200)
			.end(() => setTimeout(resolve, delay));
	});

export const updateSetting = (setting:string, value:ISetting['value']) =>
	new Promise((resolve) => {
		request
			.post(`/api/v1/settings/${setting}`)
			.set(credentials)
			.send({ value })
			.expect('Content-Type', 'application/json')
			.expect(200)
			.end(() => setTimeout(resolve, delay));
	});

export const removePermissions = async (perms: string[]) => {
	await updateManyPermissions(Object.fromEntries(perms.map((name) => [name, []])));
};

export const addPermissions = async (perms: { [key: string]: string[] }) => {
	await updateManyPermissions(perms);
};
