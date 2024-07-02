import { faker } from '@faker-js/faker';

import type { BaseTest } from '../test';

type UpdateRoomParams = { roomId: string; visitorId: string; tags: string[] };

type CloseRoomParams = { roomId: string; visitorToken: string };

type CreateRoomParams = { tags?: string[]; visitorToken: string; agentId?: string };

type CreateVisitorParams = { token: string; departmentId?: string; name?: string; email?: string };

type CreateConversationParams = { visitorName?: string; visitorToken?: string; agentId?: string; departmentId?: string };

export const updateRoom = async (api: BaseTest['api'], { roomId, visitorId, tags }: UpdateRoomParams) => {
	if (!roomId) {
		throw Error('Unable to update room info, missing room id');
	}

	if (!visitorId) {
		throw Error('Unable to update room info, missing visitor id');
	}

	const response = await api.post('/livechat/room.saveInfo', {
		guestData: { _id: visitorId },
		roomData: { _id: roomId, tags },
	});

	if (response.status() !== 200) {
		throw Error(`Unable to update room info [http status: ${response.status()}]`);
	}

	return response;
};

export const closeRoom = async (api: BaseTest['api'], { roomId, visitorToken }: CloseRoomParams) =>
	api.post('/livechat/room.close', { rid: roomId, token: visitorToken });

export const createRoom = async (api: BaseTest['api'], { visitorToken, agentId }: CreateRoomParams) => {
	const response = await api.get('/livechat/room', {
		token: visitorToken,
		agentId,
	});

	if (response.status() !== 200) {
		throw Error(`Unable to create room [http status: ${response.status()}]`, { cause: await response.json() });
	}

	const { room } = await response.json();

	return {
		response,
		data: room,
		async delete() {
			await closeRoom(api, { roomId: room._id, visitorToken });
			return api.post('/method.call/livechat:removeRoom', {
				message: JSON.stringify({
					msg: 'method',
					id: '16',
					method: 'livechat:removeRoom',
					params: [room._id],
				}),
			});
		},
	};
};

export const createVisitor = async (api: BaseTest['api'], { name, token, departmentId }: CreateVisitorParams) => {
	const response = await api.post('/livechat/visitor', {
		visitor: {
			name: name || faker.person.fullName(),
			email: faker.internet.email(),
			token,
			...(departmentId && { department: departmentId }),
		},
	});

	if (response.status() !== 200) {
		throw Error(`Unable to create visitor [http status: ${response.status()}]`);
	}

	const { visitor } = await response.json();

	return {
		response,
		data: visitor,
		delete: async () => api.delete(`/livechat/visitor/${token}`),
	};
};

export const sendMessageToRoom = async (
	api: BaseTest['api'],
	{ visitorToken, roomId, message }: { visitorToken: string; roomId: string; message?: string },
) => {
	const response = await api.post(`/livechat/message`, {
		token: visitorToken,
		rid: roomId,
		msg: message || faker.lorem.sentence(),
	});

	if (response.status() !== 200) {
		throw Error(`Unable to send message to room [http status: ${response.status()}]`);
	}

	return response;
};

export const createConversation = async (
	api: BaseTest['api'],
	{ visitorName, visitorToken, agentId, departmentId }: CreateConversationParams = {},
) => {
	const token = visitorToken || faker.string.uuid();

	const { data: visitor, delete: deleteVisitor } = await createVisitor(api, { token, name: visitorName, departmentId });
	const { data: room, delete: deleteRoom } = await createRoom(api, { visitorToken: token, agentId });
	await sendMessageToRoom(api, { visitorToken: token, roomId: room._id });

	return {
		data: {
			room,
			visitor,
		},
		delete: async () => {
			await deleteRoom();
			await deleteVisitor();
		},
	};
};
