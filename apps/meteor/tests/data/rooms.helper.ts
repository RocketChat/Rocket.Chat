import type { Credentials } from '@rocket.chat/api-client';
import type { IRoom, ISubscription, IUser } from '@rocket.chat/core-typings';
import type { Endpoints } from '@rocket.chat/rest-typings';

import { api, assertSuccess, credentials, methodCall, request, RequestFailedError } from './api-data';
import type { IRequestConfig } from './users.helper';

type CreateRoomParams = {
	name?: IRoom['name'];
	type: IRoom['t'];
	username?: string;
	members?: string[];
	credentials?: Credentials;
	readOnly?: boolean;
	extraData?: Record<string, any>;
	config?: IRequestConfig;
};

/**
 * @throws {RequestFailedError} when the room is not created
 */
export const createRoom = async ({
	name,
	type,
	username,
	members,
	credentials: customCredentials,
	extraData,
	readOnly,
	config,
}: CreateRoomParams) => {
	if (!type) {
		throw new Error('"type" is required in "createRoom.ts" test helper');
	}

	const requestInstance = config?.request || request;
	const credentialsInstance = config?.credentials || customCredentials || credentials;

	if (type === 'd' && !username) {
		throw new Error('To be able to create DM Room, you must provide the username');
	}

	const endpoints = {
		c: 'channels.create',
		p: 'groups.create',
		d: 'im.create',
	} as const;
	const params = type === 'd' ? { username } : { name };

	const roomType = endpoints[type as keyof typeof endpoints];

	const res = await requestInstance
		.post(api(roomType))
		.set(credentialsInstance)
		.send({
			...params,
			...(members && { members }),
			...(readOnly && { readOnly }),
			...(extraData && { extraData }),
		});

	return assertSuccess(roomType, res);
};

type ActionType = 'delete' | 'close' | 'addOwner' | 'removeOwner';
export type ActionRoomParams = {
	action: ActionType;
	type: Exclude<IRoom['t'], 'l'>;
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

/**
 * @throws {RequestFailedError} when the request fails or the user has no subscription to the room
 */
export const getSubscriptionByRoomId = async (
	roomId: IRoom['_id'],
	userCredentials = credentials,
	req = request,
): Promise<ISubscription> => {
	const res = assertSuccess('subscriptions.getOne', await req.get(api('subscriptions.getOne')).set(userCredentials).query({ roomId }));

	if (!res.body.subscription) {
		throw new RequestFailedError('subscriptions.getOne', res.status, res.body);
	}

	return res.body.subscription;
};

/**
 * Invites users through channels.invite / groups.invite, the endpoints the "Add users" UI uses.
 * Supports local and federated users; resolves to one response per username.
 *
 * @throws {RequestFailedError} when any of the invites fails
 */
export const addUserToRoom = ({
	usernames,
	rid,
	type = 'c',
	userCredentials,
	config,
}: {
	usernames: string[];
	rid: IRoom['_id'];
	type?: 'c' | 'p';
	userCredentials?: Credentials;
	config?: IRequestConfig;
}) => {
	const requestInstance = config?.request || request;
	const credentialsInstance = config?.credentials || userCredentials || credentials;
	const endpoint = type === 'p' ? 'groups.invite' : 'channels.invite';

	// The REST invite endpoints accept a single invitee per call, so we issue one
	// request per username (mirroring how the UI fans out the invites).
	return Promise.all(
		usernames.map(async (username) =>
			assertSuccess(endpoint, await requestInstance.post(api(endpoint)).set(credentialsInstance).send({ roomId: rid, username })),
		),
	);
};

/**
 * Adds users to a direct room through the deprecated `addUsersToRoom` method, the only entrypoint
 * that accepts a direct room. Prefer {@link addUserToRoom} for channels and groups.
 *
 * @throws {RequestFailedError} with the method's DDP result as `body` when the method fails
 */
// TODO: move addUserToDirectRoomViaMethod to REST once an endpoint can add users to a direct room
export const addUserToDirectRoomViaMethod = async ({
	usernames,
	rid,
	config,
}: {
	usernames: string[];
	rid: IRoom['_id'];
	config: IRequestConfig;
}) => {
	const res = await config.request
		.post(methodCall('addUsersToRoom'))
		.set(config.credentials)
		.send({
			message: JSON.stringify({
				method: 'addUsersToRoom',
				params: [{ rid, users: usernames }],
				id: 'id',
				msg: 'method',
			}),
		});

	const carriesMethodReply = (res.status === 200 || res.status === 400) && typeof res.body?.message === 'string';
	const result = carriesMethodReply ? JSON.parse(res.body.message) : undefined;

	if (res.status !== 200 || res.body?.success !== true || !result || result.error) {
		throw new RequestFailedError('method.call/addUsersToRoom', res.status, result ?? res.body);
	}

	return result.result as boolean;
};

/**
 * Runs `/invite` through commands.run, the way the composer does. A rejected invite is not an
 * error here: the command still succeeds and reports it to the caller as an ephemeral message.
 *
 * @throws {RequestFailedError} when the command itself fails to run
 */
export const addUserToRoomSlashCommand = async ({
	usernames,
	rid,
	config,
}: {
	usernames: string[];
	rid: IRoom['_id'];
	config?: IRequestConfig;
}) => {
	if (!usernames || usernames.length === 0) {
		throw new Error('"usernames" is required in "addUserToRoomSlashCommand" test helper');
	}
	if (!rid) {
		throw new Error('"rid" is required in "addUserToRoomSlashCommand" test helper');
	}

	const requestInstance = config?.request || request;
	const credentialsInstance = config?.credentials || credentials;

	const res = await requestInstance
		.post(api('commands.run'))
		.set(credentialsInstance)
		.send({
			command: 'invite',
			params: usernames.join(' '),
			roomId: rid,
			triggerId: `test-trigger-${Date.now()}`,
		});

	return assertSuccess('commands.run', res);
};

/**
 * @throws {RequestFailedError} when the room info cannot be fetched
 */
export const getRoomInfo = async (roomId: IRoom['_id'], config?: IRequestConfig) => {
	const requestInstance = config?.request || request;
	const credentialsInstance = config?.credentials || credentials;

	const res = await requestInstance.get(api('rooms.info')).set(credentialsInstance).query({ roomId });

	return assertSuccess('rooms.info', res).body as ReturnType<Endpoints['/v1/rooms.info']['GET']>;
};

/**
 * @throws {RequestFailedError} when the member list cannot be fetched
 */
export const getRoomMembers = async (roomId: IRoom['_id'], config?: IRequestConfig) => {
	const requestInstance = config?.request || request;
	const credentialsInstance = config?.credentials || credentials;

	const res = await requestInstance.get(api('rooms.membersOrderedByRole')).set(credentialsInstance).query({ roomId });

	return assertSuccess('rooms.membersOrderedByRole', res).body as ReturnType<Endpoints['/v1/rooms.membersOrderedByRole']['GET']>;
};

/**
 * Polls the member list until `username` shows up, for membership that federation propagates
 * eventually. Resolves to `null` when the user never appears.
 *
 * @throws {RequestFailedError} when the member list cannot be fetched
 */
export const findRoomMember = async (
	roomId: IRoom['_id'],
	username: string,
	options: { maxRetries?: number; delay?: number; initialDelay?: number } = {},
	config?: IRequestConfig,
): Promise<IUser | null> => {
	const { maxRetries = 3, delay = 1000, initialDelay = 0 } = options;

	if (initialDelay > 0) {
		await new Promise((resolve) => setTimeout(resolve, initialDelay));
	}

	for (let attempt = 1; attempt <= maxRetries; attempt++) {
		const membersResponse = await getRoomMembers(roomId, config);
		const member = membersResponse.members.find((member: IUser) => member.username === username);

		if (member) {
			return member;
		}

		if (attempt < maxRetries) {
			await new Promise((resolve) => setTimeout(resolve, delay));
		}
	}

	return null;
};

/**
 * @throws {RequestFailedError} when the history cannot be fetched
 */
export const getGroupHistory = async (roomId: IRoom['_id'], config?: IRequestConfig) => {
	const requestInstance = config?.request || request;
	const credentialsInstance = config?.credentials || credentials;

	const res = await requestInstance.get(api('groups.history')).set(credentialsInstance).query({ roomId });

	return assertSuccess('groups.history', res).body as ReturnType<Endpoints['/v1/groups.history']['GET']>;
};

const answerRoomInvite = async (roomId: IRoom['_id'], action: 'accept' | 'reject', config?: IRequestConfig) => {
	const requestInstance = config?.request || request;
	const credentialsInstance = config?.credentials || credentials;

	const res = await requestInstance.post(api('rooms.invite')).set(credentialsInstance).send({ roomId, action });

	return assertSuccess('rooms.invite', res).body as { success: true };
};

/**
 * @throws {RequestFailedError} when the invite cannot be accepted
 */
export const acceptRoomInvite = (roomId: IRoom['_id'], config?: IRequestConfig) => answerRoomInvite(roomId, 'accept', config);

/**
 * @throws {RequestFailedError} when the invite cannot be rejected
 */
export const rejectRoomInvite = (roomId: IRoom['_id'], config?: IRequestConfig) => answerRoomInvite(roomId, 'reject', config);

/**
 * @throws {RequestFailedError} when the subscriptions cannot be fetched
 */
export const getSubscriptions = async (config?: IRequestConfig) => {
	const requestInstance = config?.request || request;
	const credentialsInstance = config?.credentials || credentials;

	const res = await requestInstance.get(api('subscriptions.get')).set(credentialsInstance);

	return assertSuccess('subscriptions.get', res).body as ReturnType<Endpoints['/v1/subscriptions.get']['GET']>;
};
