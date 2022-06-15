import { api, credentials, request } from '../api-data';
import { adminUsername } from '../user';

export const createLivechatRoom = (visitorToken) =>
	new Promise((resolve) => {
		request
			.get(api(`livechat/room?token=${visitorToken}`))
			.set(credentials)
			.end((err, res) => resolve(res.body.room));
	});

export const createVisitor = () =>
	new Promise((resolve) => {
		request.get(api('livechat/visitor/iNKE8a6k6cjbqWhWd')).end((err, res) => {
			if (!err && res && res.body && res.body.visitor) {
				return resolve(res.body.visitor);
			}
			request
				.post(api('livechat/visitor'))
				.set(credentials)
				.send({
					visitor: {
						name: `Visitor ${Date.now()}`,
						email: 'visitor@rocket.chat',
						token: 'iNKE8a6k6cjbqWhWd',
						phone: '55 51 5555-5555',
						customFields: [{ key: 'address', value: 'Rocket.Chat street', overwrite: true }],
					},
				})
				.end((err, res) => {
					resolve(res.body.visitor);
				});
		});
	});

export const createAgent = () =>
	new Promise((resolve) => {
		request
			.post(api('livechat/users/agent'))
			.set(credentials)
			.send({
				username: adminUsername,
			})
			.end((err, res) => resolve(res.body.user));
	});

export const createManager = () =>
	new Promise((resolve) => {
		request
			.post(api('livechat/users/manager'))
			.set(credentials)
			.send({
				username: adminUsername,
			})
			.end((err, res) => resolve(res.body.user));
	});
