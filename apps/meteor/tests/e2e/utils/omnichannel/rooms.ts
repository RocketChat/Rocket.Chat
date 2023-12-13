import { faker } from '@faker-js/faker';

import { BaseTest } from '../test';

type UpdateRoomParams = { roomId: string; visitorId: string; tags: string[] };

type CreateRoomParams = { tags?: string[]; visitorToken: string; agentId?: string };

type CreateVisitorParams = { token: string; department?: string; name: string; email: string };

type CreateConversationParams = { visitorName?: string; visitorToken?: string; agentId?: string; departmentId?: string };

export const updateRoom = async (api: BaseTest['api'], { roomId, visitorId, tags }: UpdateRoomParams) => {
	if (!roomId) {
		throw Error('Unable to update room info, missing room id');
	}

	if (!visitorId) {
		throw Error('Unable to update room info, missing visitor id');
	}

	return api.post('/livechat/room.saveInfo', {
		guestData: { _id: visitorId },
		roomData: { _id: roomId, tags },
	});
};

export const createRoom = async (api: BaseTest['api'], { visitorToken, agentId }: CreateRoomParams) => {
	const response = await api.get('/livechat/room', {
		token: visitorToken,
		agentId,
	});

	if (response.status() !== 200) {
		throw Error(`Unable to create room [http status: ${response.status()}]`);
	}

	const data = await response.json();

	return {
		response,
		data: data.room,
		delete: async () => {
			await api.post('/livechat/room.close', { rid: data.room._id, token: visitorToken });
			await api.post('/method.call/livechat:removeRoom', {
				message: JSON.stringify({
					msg: 'method',
					id: '16',
					method: 'livechat:removeRoom',
					params: [data.room._id],
				}),
			});
		},
	};
};

export const createVisitor = async (api: BaseTest['api'], params: CreateVisitorParams) =>
	api.post('/livechat/visitor', { visitor: params });

export const sendMessageToRoom = async (
	api: BaseTest['api'],
	{ visitorToken, roomId, message }: { visitorToken: string; roomId: string; message?: string },
) =>
	api.post(`/livechat/message`, {
		token: visitorToken,
		rid: roomId,
		msg: message || faker.lorem.sentence(),
	});

export const createConversation = async (
	api: BaseTest['api'],
	{ visitorName, visitorToken, agentId, departmentId }: CreateConversationParams,
) => {
	const token = visitorToken || faker.string.uuid();
	const visitorRes = await createVisitor(api, {
		name: visitorName || faker.person.firstName(),
		email: faker.internet.email(),
		token,
		...(departmentId && { department: departmentId }),
	});

	if (visitorRes.status() !== 200) {
		throw Error(`Unable to create visitor [http status: ${visitorRes.status()}]`);
	}

	const { data: room } = await createRoom(api, { visitorToken: token, agentId });

	const messageRes = await sendMessageToRoom(api, { visitorToken: token, roomId: room._id });

	if (messageRes.status() !== 200) {
		throw Error(`Unable to send message to room [http status: ${messageRes.status()}]`);
	}

	const { visitor } = await visitorRes.json();

	return {
		room,
		visitor,
	};
};
