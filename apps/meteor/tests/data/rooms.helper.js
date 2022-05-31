import { api, credentials, request } from './api-data';

export const createRoom = ({ name, type, username, token, agentId, members, credentials: customCredentials }) => {
	if (!type) {
		throw new Error('"type" is required in "createRoom.ts" test helper');
	}
	if (type === 'v') {
		/* Special handling for voip type of rooms.
		 * The endpoints below do not have a way to create
		 * a voip room. Hence creation of a voip room
		 * is handled separately here.
		 */
		return request
			.get(api(`voip/room?token=${token}&agentId=${agentId}`))
			.set(customCredentials || credentials)
			.send();
	}
	if (type === 'd' && !username) {
		throw new Error('To be able to create DM Room, you must provide the username');
	}
	const endpoints = {
		c: 'channels.create',
		p: 'groups.create',
		d: 'im.create',
	};
	const params = type === 'd' ? { username } : { name };

	return request
		.post(api(endpoints[type]))
		.set(customCredentials || credentials)
		.send({
			...params,
			...(members && { members }),
		});
};

export const asyncCreateRoom = ({ name, type, username, members = [] }) =>
	new Promise((resolve) => {
		createRoom({ name, type, username, members }).end(resolve);
	});

function actionRoom({ action, type, roomId }) {
	if (!type) {
		throw new Error(`"type" is required in "${action}Room" test helper`);
	}
	if (!roomId) {
		throw new Error(`"roomId" is required in "${action}Room" test helper`);
	}
	const endpoints = {
		c: 'channels',
		p: 'groups',
		d: 'im',
	};
	return new Promise((resolve) => {
		request
			.post(api(`${endpoints[type]}.${action}`))
			.set(credentials)
			.send({
				roomId,
			})
			.end(resolve);
	});
}

export const deleteRoom = ({ type, roomId }) => actionRoom({ action: 'delete', type, roomId });

export const closeRoom = ({ type, roomId }) => actionRoom({ action: 'close', type, roomId });
