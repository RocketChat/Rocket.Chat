import { faker } from '@faker-js/faker';
import type {
	ILivechatInquiryRecord,
	ILivechatAgent,
	ILivechatDepartment,
	ILivechatVisitor,
	IMessage,
	IOmnichannelRoom,
} from '@rocket.chat/core-typings';
import { api, credentials, methodCall, request } from '../api-data';
import { getSettingValueById, restorePermissionToRoles, updateSetting } from '../permissions.helper';
import { IUserCredentialsHeader, adminUsername } from '../user';
import { getRandomVisitorToken } from './users';
import { DummyResponse, sleep } from './utils';
import { Response } from 'supertest';
import { imgURL } from '../interactions';

export const createLivechatRoom = async (visitorToken: string, extraRoomParams?: Record<string, string>): Promise<IOmnichannelRoom> => {
	const urlParams = new URLSearchParams();
	urlParams.append('token', visitorToken);
	if (extraRoomParams) {
		for (const [key, value] of Object.entries(extraRoomParams)) {
			urlParams.append(key, value);
		}
	}

	const response = await request
		.get(api(`livechat/room?${urlParams.toString()}`))
		.set(credentials)
		.expect(200);

	return response.body.room;
};

export const createVisitor = (department?: string): Promise<ILivechatVisitor> =>
	new Promise((resolve, reject) => {
		const token = getRandomVisitorToken();
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

export const deleteVisitor = async (token: string): Promise<void> => {
	await request.delete(api(`livechat/visitor/${token}`));
}

export const takeInquiry = async (inquiryId: string, agentCredentials?: IUserCredentialsHeader): Promise<void> => {
    const userId = agentCredentials ? agentCredentials['X-User-Id'] : credentials['X-User-Id'];

    await request.post(api('livechat/inquiries.take')).set(agentCredentials || credentials).send({ userId, inquiryId }).expect(200);
};

export const fetchInquiry = (roomId: string): Promise<ILivechatInquiryRecord> => {
	return new Promise((resolve, reject) => {
		request
			.get(api(`livechat/inquiries.getOne?roomId=${roomId}`))
			.set(credentials)
			.end((err: Error, res: DummyResponse<ILivechatInquiryRecord>) => {
				if (err) {
					return reject(err);
				}
				resolve(res.body.inquiry);
			});
	});
};

export const createDepartment = (agents?: { agentId: string }[], name?: string, enabled = true, opts: Record<string, any> = {}): Promise<ILivechatDepartment> => {
	return new Promise((resolve, reject) => {
		request
			.post(api('livechat/department'))
			.set(credentials)
			.send({
				department: {
					name: name || `Department ${Date.now()}`,
					enabled,
					showOnOfflineForm: true,
					showOnRegistration: true,
					email: 'a@b.com',
					...opts,
				},
				agents,
			})
			.end((err: Error, res: DummyResponse<ILivechatDepartment>) => {
				if (err) {
					return reject(err);
				}
				resolve(res.body.department);
			});
	});
};

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

export const createManager = (overrideUsername?: string): Promise<ILivechatAgent> =>
	new Promise((resolve, reject) => {
		request
			.post(api('livechat/users/manager'))
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

export const makeAgentAvailable = async (overrideCredentials?: { 'X-Auth-Token': string | undefined; 'X-User-Id': string | undefined }): Promise<Response> => {
	await restorePermissionToRoles('view-l-room');
	await request
		.post(api('users.setStatus'))
		.set(overrideCredentials || credentials)
		.send({
			message: '',
			status: 'online',
		});

	return request
		.post(api('livechat/agent.status'))
		.set(overrideCredentials || credentials)
		.send({
			status: 'available',
		});
};

export const makeAgentUnavailable = async (overrideCredentials?: { 'X-Auth-Token': string; 'X-User-Id': string }): Promise<void> => {
	await request
		.post(api('users.setStatus'))
		.set(overrideCredentials || credentials)
		.send({ message: '', status: 'offline' })
		.expect(200);
	await request
		.post(api('livechat/agent.status'))
		.set(overrideCredentials || credentials)
		.send({
			status: 'not-available',
		})
		.expect(200);
};

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
};

/**
 * @summary Sends message as visitor
*/
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
};

export const uploadFile = (roomId: string, visitorToken: string): Promise<IMessage> => {
	return new Promise((resolve, reject) => {
		request
			.post(api(`livechat/upload/${roomId}`))
			.set({ 'x-visitor-token': visitorToken, ...credentials })
			.attach('file', imgURL)
			.end((err: Error, res: DummyResponse<IMessage>) => {
				if (err) {
					return reject(err);
				}
				resolve(res.body as unknown as IMessage);
			});
	});
};

// Sends a message using sendMessage method from agent
export const sendAgentMessage = (roomId: string, msg?: string): Promise<IMessage> => {
	return new Promise((resolve, reject) => {
		request
			.post(methodCall('sendMessage'))
			.set(credentials)
			.send({
				message: JSON.stringify({
					method: 'sendMessage',
					params: [{ rid: roomId, msg: msg || faker.lorem.sentence() }],
					id: 'id',
					msg: 'method',
				}),
			})
			.end((err: Error, res: any) => {
				if (err) {
					return reject(err);
				}
				resolve(JSON.parse(res.body.message).result);
			});
	});
};

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

				if (!res.body.success) {
					reject(res.body);
					return;
				}

				resolve(res.body.messages);
			});
	});
};

export const closeOmnichannelRoom = async (roomId: string, tags?: string[]): Promise<void> => {
	await request.post(api('livechat/room.closeByUser')).set(credentials).send({ rid: roomId, ...tags && { tags }, comment: faker.lorem.sentence() }).expect(200);
};

export const bulkCreateLivechatRooms = async (
	amount: number,
	department?: string,
	resolveRoomExtraParams?: (index: number) => Record<string, string> | undefined,
): Promise<IOmnichannelRoom[]> => {
	const rooms: IOmnichannelRoom[] = [];

	for (let i = 0; i < amount; i++) {
		const visitor = await createVisitor(department);
		const extraRoomParams = resolveRoomExtraParams ? resolveRoomExtraParams(i) : {};

		const room = await createLivechatRoom(visitor.token, extraRoomParams);

		rooms.push(room);
	}

	return rooms;
};

export const startANewLivechatRoomAndTakeIt = async ({
    departmentId,
    agent
}: {
    departmentId?: string;
    agent?: IUserCredentialsHeader;
} = {}): Promise<{ room: IOmnichannelRoom; visitor: ILivechatVisitor }> => {

    const currentRoutingMethod = await getSettingValueById('Livechat_Routing_Method');
    let routingMethodChanged = false;
    if (currentRoutingMethod !== 'Manual_Selection') {
        await updateSetting('Livechat_Routing_Method', 'Manual_Selection');

        // wait for routing algorithm to stop
        await sleep(1000);
    }


	const visitor = await createVisitor(departmentId);
	const room = await createLivechatRoom(visitor.token);
	const { _id: roomId } = room;
	const inq = await fetchInquiry(roomId);
	await takeInquiry(inq._id, agent);
	await sendMessage(roomId, 'test message', visitor.token);


    if (routingMethodChanged) {
        await updateSetting('Livechat_Routing_Method', currentRoutingMethod);

        // wait for routing algorithm to start
        await sleep(1000);
    }

	return { room, visitor };
};

export const placeRoomOnHold = async (roomId: string): Promise<void> => {
    await request
        .post(api('livechat/room.onHold'))
        .set(credentials)
        .send({ roomId })
        .expect(200);
}

export const moveBackToQueue = async (roomId: string, overrideCredentials?: IUserCredentialsHeader): Promise<void> => {
	await request
		.post(methodCall('livechat:returnAsInquiry'))
		.set(overrideCredentials || credentials)
		.send({
			message: JSON.stringify({
				method: 'livechat:returnAsInquiry',
				params: [roomId],
				id: 'id',
				msg: 'method',
			}),
		})
		.expect('Content-Type', 'application/json')
		.expect(200);
};
