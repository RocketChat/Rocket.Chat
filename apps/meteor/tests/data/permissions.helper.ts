import { ISetting } from '@rocket.chat/core-typings';
import { api, credentials, request } from './api-data';

export const updatePermission = (permission:string, roles:string[]):Promise<void|Error> =>
	new Promise((resolve,reject) => {
		request
			.post(api('permissions.update'))
			.set(credentials)
			.send({ permissions: [{ _id: permission, roles }] })
			.expect('Content-Type', 'application/json')
			.expect(200)
			.end((err?:Error) => setTimeout(() => !err && resolve() || reject(err), 100));
	});

export const updateManyPermissions = (permissions: { [key: string]: string[] }):Promise<void|Error> =>
	new Promise((resolve,reject) => {
		request
			.post(api('permissions.update'))
			.set(credentials)
			.send({ permissions: Object.keys(permissions).map((k) => ({_id: k, roles: permissions[k] }))})
			.expect('Content-Type', 'application/json')
			.expect(200)
			.end((err?:Error) => setTimeout(() => !err && resolve() || reject(err), 100));
	});

export const updateSetting = (setting:string, value:ISetting['value']):Promise<void|Error> =>
	new Promise((resolve,reject) => {
		request
			.post(`/api/v1/settings/${setting}`)
			.set(credentials)
			.send({ value })
			.expect('Content-Type', 'application/json')
			.expect(200)
			.end((err?:Error) => setTimeout(() => !err && resolve() || reject(err), 100));
	});

export const removePermissions = async (perms: string[]) => {
	await updateManyPermissions(Object.fromEntries(perms.map((name) => [name, []])));
};

export const addPermissions = async (perms: { [key: string]: string[] }) => {
	await updateManyPermissions(perms);
};
