import { api, credentials, methodCall, request } from '../api-data';
import { adminUsername } from '../user';

export const createLivechatRoom = (visitorToken) =>
	new Promise((resolve) => {
		request
			.get(api(`livechat/room?token=${visitorToken}`))
			.set(credentials)
			.end((err, res) => resolve(res.body.room));
	});

export const createVisitor = () =>
	new Promise((resolve, reject) => {
		const token = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
		const email = `${token}@${token}.com`;
		const phone = `${Math.floor(Math.random() * 10000000000)}`;
		request.get(api(`livechat/visitor/${token}`)).end((err, res) => {
			if (!err && res && res.body && res.body.visitor) {
				return resolve(res.body.visitor);
			}
			request
				.post(api('livechat/visitor'))
				.set(credentials)
				.send({
					visitor: {
						name: `Visitor ${Date.now()}`,
						email,
						token,
						phone,
						customFields: [{ key: 'address', value: 'Rocket.Chat street', overwrite: true }],
					},
				})
				.end((err, res) => {
					if (err) {
						return reject(err);
					}
					resolve(res.body.visitor);
				});
		});
	});

export const createAgent = () =>
	new Promise((resolve, reject) => {
		request
			.post(api('livechat/users/agent'))
			.set(credentials)
			.send({
				username: adminUsername,
			})
			.end((err, res) => {
				if (err) {
					return reject(err);
				}
				resolve(res.body.user);
			});
	});

export const createManager = () =>
	new Promise((resolve, reject) => {
		request
			.post(api('livechat/users/manager'))
			.set(credentials)
			.send({
				username: adminUsername,
			})
			.end((err, res) => {
				if (err) {
					return reject(err);
				}
				resolve(res.body.user);
			});
	});

export const makeAgentAvailable = () =>
	new Promise((resolve, reject) => {
		request.post(api('users.setStatus')).set(credentials).send({
			message: '',
			status: 'online',
		}).end((err, res) => {
			if (err) {
				return reject(err);
			}
			request
			.post(methodCall('livechat/changeLivechatStatus'))
			.set(credentials)
			.send({
				message: JSON.stringify({
					method: 'livechat/changeLivechatStatus',
					params: ['available'],
					id: 'id',
					msg: 'method',
				}),
			})
			.end((err, res) => {
				if (err) {
					return reject(err);
				}
				resolve(res.body);
			});
		});

	});

