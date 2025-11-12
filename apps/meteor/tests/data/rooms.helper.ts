import type { Credentials } from '@rocket.chat/api-client';
import type { IRoom, ISubscription } from '@rocket.chat/core-typings';

import { api, credentials, methodCall, request } from './api-data';
import type { IRequestConfig } from './users.helper';

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
	config?: IRequestConfig;
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
	config,
}: CreateRoomParams) => {
	if (!type) {
		throw new Error('"type" is required in "createRoom.ts" test helper');
	}

	const requestInstance = config?.request || request;
	const credentialsInstance = config?.credentials || customCredentials || credentials;

	if (type === 'v') {
		/* Special handling for voip type of rooms.
		 * The endpoints below do not have a way to create
		 * a voip room. Hence creation of a voip room
		 * is handled separately here.
		 */
		return requestInstance.get(api('voip/room')).query({ token, agentId, direction: voipCallDirection }).set(credentialsInstance).send();
	}

	if (type === 'd' && !username) {
		throw new Error('To be able to create DM Room, you must provide the username');
	}

	const endpoints = {
		c: 'channels.create',
		p: 'groups.create',
		d: 'im.create',
	} as const;
	const params = type === 'd' ? { username } : { name };

	// Safe assertion because we already checked the type is not 'v'
	// which is the only case where type is not in the endpoints object
	const roomType = endpoints[type as keyof typeof endpoints];

	return requestInstance
		.post(api(roomType))
		.set(credentialsInstance)
		.send({
			...params,
			...(members && { members }),
			...(extraData && { extraData }),
		});
};

type ActionType = 'delete' | 'close' | 'addOwner' | 'removeOwner';
export type ActionRoomParams = {
	action: ActionType;
	type: Exclude<IRoom['t'], 'v' | 'l'>;
	roomId: IRoom['_id'];
	overrideCredentials?: Credentials;
	extraData?: Record<string, any>;
};

export function actionRoom({ action, type, roomId, overrideCredentials = credentials, extraData = {} }: ActionRoomParams) {
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
	} as const;

	const path = `${endpoints[type]}.${action}` as const;

	if (path === 'im.addOwner' || path === 'im.removeOwner') throw new Error(`invalid path ("${path}")`);

	return new Promise((resolve) => {
		void request
			.post(api(path))
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

export const getSubscriptionByRoomId = (roomId: IRoom['_id'], userCredentials = credentials): Promise<ISubscription> =>
	new Promise((resolve) => {
		void request
			.get(api('subscriptions.getOne'))
			.set(userCredentials)
			.query({ roomId })
			.end((_err, res) => {
				resolve(res.body.subscription);
			});
	});

/**
 * Adds users to a room using the addUsersToRoom method.
 *
 * Invites one or more users to join a room using the DDP method call.
 * Supports both local and federated users, with proper error handling
 * for federation restrictions.
 *
 * @param usernames - Array of usernames to add to the room
 * @param rid - The unique identifier of the room
 * @param userCredentials - Optional credentials for the request (deprecated, use config instead)
 * @param config - Optional request configuration for custom domains
 * @returns Promise resolving to the method call response
 */
export const addUserToRoom = ({
	usernames,
	rid,
	userCredentials,
	config,
}: {
	usernames: string[];
	rid: IRoom['_id'];
	userCredentials?: Credentials;
	config?: IRequestConfig;
}) => {
	const requestInstance = config?.request || request;
	const credentialsInstance = config?.credentials || userCredentials || credentials;

	return requestInstance
		.post(methodCall('addUsersToRoom'))
		.set(credentialsInstance)
		.send({
			message: JSON.stringify({
				method: 'addUsersToRoom',
				params: [{ rid, users: usernames }],
				id: 'id',
				msg: 'method',
			}),
		});
};
