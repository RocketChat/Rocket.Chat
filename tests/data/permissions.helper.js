import { api, credentials, request } from './api-data';

export const updatePermission = (permission, roles) => new Promise((resolve) => {
	request.post(api('permissions.update'))
		.set(credentials)
		.send({ permissions: [{ _id: permission, roles }] })
		.expect('Content-Type', 'application/json')
		.expect(200)
		.end(resolve);
});
