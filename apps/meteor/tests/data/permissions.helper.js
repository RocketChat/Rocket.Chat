import { api, credentials, request } from './api-data';

const delay = typeof cy !== 'undefined' ? 1000 : 100;

export const updatePermission = (permission, roles) =>
	new Promise((resolve) => {
		request
			.post(api('permissions.update'))
			.set(credentials)
			.send({ permissions: [{ _id: permission, roles }] })
			.expect('Content-Type', 'application/json')
			.expect(200)
			.end(() => setTimeout(resolve, delay));
	});

export const updateSetting = (setting, value) =>
	new Promise((resolve) => {
		request
			.post(`/api/v1/settings/${setting}`)
			.set(credentials)
			.send({ value })
			.expect('Content-Type', 'application/json')
			.expect(200)
			.end(() => setTimeout(resolve, delay));
	});
