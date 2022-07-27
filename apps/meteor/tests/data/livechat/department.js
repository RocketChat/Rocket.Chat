import { api, credentials, methodCall, request } from '../api-data';
import { faker } from '@faker-js/faker';

export const createDepartment = () =>
	new Promise((resolve, reject) => {
		request
			.post(methodCall('livechat:saveDepartment'))
			.set(credentials)
			.send({
				message: JSON.stringify({
					method: 'livechat:saveDepartment',
					params: ['', {
						enabled: true,
						email: faker.internet.email(),
						showOnRegistration: true,
						showOnOfflineForm: true,
						name: `new department ${Date.now()}`,
						description: 'created from api',
					}, []],
					id: 'id',
					msg: 'method',
				}),
			})
			.end((err, res) => {
				if (err) {
					return reject(err);
				}
				resolve(JSON.parse(res.body.message).result);
			});
	});
