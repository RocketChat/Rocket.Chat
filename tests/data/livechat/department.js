import { api, credentials, request } from '../api-data';

export const createDepartment = () =>
	new Promise((resolve, reject) => {
		request
			.post(api('livechat/department'))
			.send({
				department: {
					enabled: false,
					email: 'email@email.com',
					showOnRegistration: true,
					showOnOfflineForm: true,
					name: `new department ${Date.now()}`,
					description: 'created from api',
				},
			})
			.set(credentials)
			.end((err, res) => {
				if (err) {
					return reject(err);
				}
				resolve(res.body.department);
			});
	});
