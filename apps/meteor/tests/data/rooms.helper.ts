import type { IRoom } from '@rocket.chat/core-typings';
import { api, credentials, request } from './api-data';
import type { IUser } from '@rocket.chat/core-typings';

type Credentials = { 'X-Auth-Token'?: string; 'X-User-Id'?: string };

type CreateRoomParams = {
	name?: IRoom['name'];
	type: IRoom['t'];
	username?: string;
	token?: string;
	agentId?: string;
	members?: string[];
	credentials?: Credentials;
	extraData?: Record<string, any>;
	voipCallDirection?: 'inbound' | 'outbound';
};

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
}: CreateRoomParams) => {
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

	// Safe assertion because we already checked the type is not 'v'
	// which is the only case where type is not in the endpoints object
	const roomType = endpoints[type as keyof typeof endpoints];

	return request
		.post(api(roomType))
		.set(customCredentials || credentials)
		.send({
			...params,
			...(members && { members }),
			...(extraData && { extraData }),
		});
};

export const asyncCreateRoom = ({ name, type, username, members = [] }: Pick<CreateRoomParams, 'name' | 'type' | 'username' | 'members'>) =>
	new Promise((resolve) => {
		createRoom({ name, type, username, members }).end(resolve);
	});

type ActionType = 'delete' | 'close' | 'addOwner' | 'removeOwner';
type ActionRoomParams = {
	action: ActionType;
	type: Exclude<IRoom['t'], 'v' | 'l'>;
	roomId: IRoom['_id'];
	overrideCredentials?: Credentials;
	extraData?: Record<string, any>;
};

function actionRoom({ action, type, roomId, overrideCredentials = credentials, extraData = {} }: ActionRoomParams) {
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
			.set(overrideCredentials)
			.send({
				roomId,
				...extraData,
			})
			.end(resolve);
	});
}

export const deleteRoom = ({ type, roomId }: { type: ActionRoomParams['type']; roomId: IRoom['_id'] }) =>
	actionRoom({ action: 'delete', type, roomId, overrideCredentials: credentials });

export const closeRoom = ({ type, roomId }: { type: ActionRoomParams['type']; roomId: IRoom['_id'] }) =>
	actionRoom({ action: 'close', type, roomId });

export const joinChannel = ({ overrideCredentials = credentials, roomId }: { overrideCredentials: Credentials; roomId: IRoom['_id'] }) =>
	request.post(api('channels.join')).set(overrideCredentials).send({
		roomId,
	});

export const inviteToChannel = ({
	overrideCredentials = credentials,
	roomId,
	userId,
}: {
	overrideCredentials: Credentials;
	roomId: IRoom['_id'];
	userId: IUser['_id'];
}) =>
	request.post(api('channels.invite')).set(overrideCredentials).send({
		userId,
		roomId,
	});

export const addRoomOwner = ({ type, roomId, userId }: { type: ActionRoomParams['type']; roomId: IRoom['_id']; userId: IUser['_id'] }) =>
	actionRoom({ action: 'addOwner', type, roomId, extraData: { userId } });

export const removeRoomOwner = ({ type, roomId, userId }: { type: ActionRoomParams['type']; roomId: IRoom['_id']; userId: IUser['_id'] }) =>
	actionRoom({ action: 'removeOwner', type, roomId, extraData: { userId } });

export const getChannelRoles = async ({
	roomId,
	overrideCredentials = credentials,
}: {
	roomId: IRoom['_id'];
	overrideCredentials: Credentials;
}) =>
	(
		await request.get(api('channels.roles')).set(overrideCredentials).query({
			roomId,
		})
	).body.roles;

export const setRoomConfig = ({ roomId, favorite, isDefault }: { roomId: IRoom['_id']; favorite: boolean; isDefault: boolean }) => {
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
