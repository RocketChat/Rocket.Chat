import { resolve } from 'path';
import { api, credentials, request } from './api-data';

export const createRoom = ({
	name,
	type,
	username,
	token,
	agentId,
	members,
	credentials: customCredentials,
	extraData,
	voipCallDirection = 'inbound',
}) => {
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
			.get(api(`voip/room?token=${token}&agentId=${agentId}&direction=${voipCallDirection}`))
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
			...(extraData && { extraData }),
		});
};

export const asyncCreateRoom = ({ name, type, username, members = [] }) =>
	new Promise((resolve) => {
		createRoom({ name, type, username, members }).end(resolve);
	});

function actionRoom({ action, type, roomId, extraData = {} }) {
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
				...extraData,
			})
			.end(resolve);
	});
}

export const deleteRoom = ({ type, roomId }) => actionRoom({ action: 'delete', type, roomId });

export const closeRoom = ({ type, roomId }) => actionRoom({ action: 'close', type, roomId });

export const joinChannel = ({ overrideCredentials = credentials, roomId }) =>
	request.post(api('channels.join')).set(overrideCredentials).send({
		roomId,
	});

export const inviteToChannel = ({ overrideCredentials = credentials, roomId, userId }) =>
	request.post(api('channels.invite')).set(credentials).send({
		userId,
		roomId,
	});

export const addRoomOwner = ({ type, roomId, userId }) => actionRoom({ action: 'addOwner', type, roomId, extraData: { userId } });

export const removeRoomOwner = ({ type, roomId, userId }) => actionRoom({ action: 'removeOwner', type, roomId, extraData: { userId } });

export const getChannelRoles = async ({ roomId, overrideCredentials = credentials }) =>
	(
		await request.get(api('channels.roles')).set(overrideCredentials).query({
			roomId,
		})
	).body.roles;

export const setRoomConfig = ({ roomId, favorite, isDefault }) => {
	return request
		.post(api('rooms.saveRoomSettings'))
		.set(credentials)
		.send({
			rid: roomId,
			default: isDefault,
			favorite: favorite
				? {
						defaultValue: true,
						favorite: false,
				  }
				: undefined,
		});
};
