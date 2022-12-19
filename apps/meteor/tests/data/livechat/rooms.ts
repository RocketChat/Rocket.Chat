import faker from '@faker-js/faker';
import type { IInquiry, ILivechatAgent, ILivechatDepartment, ILivechatVisitor, IMessage, IOmnichannelRoom } from '@rocket.chat/core-typings';
import { api, credentials, methodCall, request } from '../api-data';
import { adminUsername } from '../user';
import { DummyResponse } from './utils';

export const createLivechatRoom = (visitorToken: string): Promise<IOmnichannelRoom> =>
	new Promise((resolve) => {
		request
			.get(api(`livechat/room?token=${visitorToken}`))
			.set(credentials)
			.end((_err: Error, res: DummyResponse<IOmnichannelRoom>) => resolve(res.body.room));
	});

export const createVisitor = (department?: string): Promise<ILivechatVisitor> =>
	new Promise((resolve, reject) => {
		const token = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
		const email = `${token}@${token}.com`;
		const phone = `${Math.floor(Math.random() * 10000000000)}`;
		request.get(api(`livechat/visitor/${token}`)).end((err: Error, res: DummyResponse<ILivechatVisitor>) => {
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
						...(department ? { department } : {}),
					},
				})
				.end((err: Error, res: DummyResponse<ILivechatVisitor>) => {
					if (err) {
						return reject(err);
					}
					resolve(res.body.visitor);
				});
		});
	});

export const takeInquiry = (roomId: string, _agentId?: string): Promise<IOmnichannelRoom> => {
	return new Promise((resolve, reject) => {
		request
			.post(methodCall(`livechat:takeInquiry`))
			.set(credentials)
			.send({
				message: JSON.stringify({
					method: 'livechat:takeInquiry',
					params: [roomId, { clientAction: true }],
					id: '101',
					msg: 'method',
				}),
			})
			.end((err: Error, res: DummyResponse<IOmnichannelRoom, 'unwrapped'>) => {
				if (err) {
					return reject(err);
				}
				resolve(res.body);
			});
	});
};

export const fetchInquiry = (roomId: string): Promise<IInquiry> => {
	return new Promise((resolve, reject) => {
		request
			.get(api(`livechat/inquiries.getOne?roomId=${roomId}`))
			.set(credentials)
			.end((err: Error, res: DummyResponse<IInquiry>) => {
				if (err) {
					return reject(err);
				}
				resolve(res.body.inquiry);
			});
	});
};

export const createDepartment = (agents?: { agentId: string }[]): Promise<ILivechatDepartment> => {
	return new Promise((resolve, reject) => {
		request
			.post(api('livechat/department'))
			.set(credentials)
			.send({ department: { name: `Department ${Date.now()}`, enabled: true, showOnOfflineForm: true, showOnRegistration: true, email: 'a@b.com' }, agents })
			.end((err: Error, res: DummyResponse<ILivechatDepartment>) => {
				if (err) {
					return reject(err);
				}
				resolve(res.body.department);
			});
	});
}

export const createAgent = (overrideUsername?: string): Promise<ILivechatAgent> =>
	new Promise((resolve, reject) => {
		request
			.post(api('livechat/users/agent'))
			.set(credentials)
			.send({
				username: overrideUsername || adminUsername,
			})
			.end((err: Error, res: DummyResponse<ILivechatAgent>) => {
				if (err) {
					return reject(err);
				}
				resolve(res.body.user);
			});
	});

export const createManager = (): Promise<ILivechatAgent> =>
	new Promise((resolve, reject) => {
		request
			.post(api('livechat/users/manager'))
			.set(credentials)
			.send({
				username: adminUsername,
			})
			.end((err: Error, res: DummyResponse<ILivechatAgent>) => {
				if (err) {
					return reject(err);
				}
				resolve(res.body.user);
			});
	});

export const makeAgentAvailable = (overrideCredentials?: { 'X-Auth-Token': string; 'X-User-Id': string }): Promise<unknown> =>
	new Promise((resolve, reject) => {
		request.post(api('users.setStatus')).set(overrideCredentials || credentials).send({
			message: '',
			status: 'online',
		}).end((err: Error, _res: DummyResponse<unknown, 'unwrapped'>) => {
			if (err) {
				return reject(err);
			}
			request
			.post(methodCall('livechat/changeLivechatStatus'))
			.set(overrideCredentials || credentials)
			.send({
				message: JSON.stringify({
					method: 'livechat/changeLivechatStatus',
					params: ['available'],
					id: 'id',
					msg: 'method',
				}),
			})
			.end((err: Error, res: DummyResponse<unknown, 'unwrapped'>) => {
				if (err) {
					return reject(err);
				}
				resolve(res.body);
			});
		});
	});

export const makeAgentUnavailable = (overrideCredentials?: { 'X-Auth-Token': string; 'X-User-Id': string }): Promise<unknown> =>
	new Promise((resolve, reject) => {
		request.post(api('users.setStatus')).set(overrideCredentials || credentials).send({
			message: '',
			status: 'offline',
		}).end((err: Error, _res: DummyResponse<unknown, 'unwrapped'>) => {
			if (err) {
				return reject(err);
			}
			request
			.post(methodCall('livechat/changeLivechatStatus'))
			.set(overrideCredentials || credentials)
			.send({
				message: JSON.stringify({
					method: 'livechat/changeLivechatStatus',
					params: ['not-available'],
					id: 'id',
					msg: 'method',
				}),
			})
			.end((err: Error, res: DummyResponse<unknown, 'unwrapped'>) => {
				if (err) {
					return reject(err);
				}
				resolve(res.body);
			});
		});
	});


export const getLivechatRoomInfo = (roomId: string): Promise<IOmnichannelRoom> => {
	return new Promise((resolve /* , reject*/) => {
		request
			.get(api('channels.info'))
			.set(credentials)
			.query({
				roomId,
			})
			.end((_err: Error, res: DummyResponse<IOmnichannelRoom>) => {
				resolve(res.body.channel);
			});
	});
}

export const sendMessage = (roomId: string, message: string, visitorToken: string): Promise<IMessage> => {
	return new Promise((resolve, reject) => {
		request
			.post(api('livechat/message'))
			.set(credentials)
			.send({
				rid: roomId,
				msg: message,
				token: visitorToken,
			})
			.end((err: Error, res: DummyResponse<IMessage>) => {
				if (err) {
					return reject(err);
				}
				resolve(res.body.message);
			});
	});
}

// Sends a message using sendMessage method from agent
export const sendAgentMessage = (roomId: string): Promise<IMessage> => {
	return new Promise((resolve, reject) => {
		request
			.post(methodCall('sendMessage'))
			.set(credentials)
			.send({
				message: JSON.stringify({
					method: 'sendMessage',
					params: [{ rid: roomId, msg: faker.lorem.sentence() }],
					id: 'id',
					msg: 'method',
				}),
			})
			.end((err: Error, res: DummyResponse<IMessage, 'wrapped'>) => {
				if (err) {
					return reject(err);
				}
				resolve(res.body.result);
			});
	});
}

export const fetchMessages = (roomId: string, visitorToken: string): Promise<IMessage[]> => {
	return new Promise((resolve, reject) => {
		request
			.get(api(`livechat/messages.history/${roomId}`))
			.set(credentials)
			.query({
				token: visitorToken,
			})
			.end((err: Error, res: DummyResponse<IMessage[]>) => {
				if (err) {
					return reject(err);
				}
				resolve(res.body.messages);
			});
	});
}

// Closes room using methodCall
export const closeRoom = (roomId: string): Promise<boolean> => {
	return new Promise((resolve, reject) => {
		request
			.post(methodCall('livechat:closeRoom'))
			.set(credentials)
			.send({
				message: JSON.stringify({
					method: 'livechat:closeRoom',
					params: [roomId, faker.lorem.sentence(), { clientAction: true}],
					id: 'id',
					msg: 'method',
				}),
			})
			.end((err: Error, res: DummyResponse<boolean, 'wrapped'>) => {
				if (err) {
					return reject(err);
				}
				resolve(res.body.result);
			});
	});
}
