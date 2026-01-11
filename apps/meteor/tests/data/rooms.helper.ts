import type { Credentials } from '@rocket.chat/api-client';
import type { IRoom, ISubscription, IUser, IMessage } from '@rocket.chat/core-typings';
import type { Endpoints } from '@rocket.chat/rest-typings';

import { api, credentials, methodCall, request } from './api-data';
import type { IRequestConfig } from './users.helper';

type CreateRoomParams = {
	name?: IRoom['name'];
	type: IRoom['t'];
	username?: string;
	members?: string[];
	credentials?: Credentials;
	extraData?: Record<string, any>;
	config?: IRequestConfig;
};

export const createRoom = ({ name, type, username, members, credentials: customCredentials, extraData, config }: CreateRoomParams) => {
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

export const getSubscriptionByRoomId = (roomId: IRoom['_id'], userCredentials = credentials, req = request): Promise<ISubscription> =>
	new Promise((resolve, reject) => {
		void req
			.get(api('subscriptions.getOne'))
			.set(userCredentials)
			.query({ roomId })
			.end((err, res) => {
				if (err) {
					return reject(err);
				}
				if (!res.body?.subscription) {
					return reject(new Error('Subscription not found'));
				}

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

/**
 * Adds users to a room using the /invite slash command via method.call.
 *
 * Executes the /invite slash command using the DDP method call to add users to a room.
 * This simulates the user experience of using slash commands in the UI.
 * Supports both local and federated users, with proper error handling for federation restrictions.
 *
 * @param usernames - Array of usernames to add to the room
 * @param rid - The unique identifier of the room
 * @param config - Optional request configuration for custom domains
 * @returns Promise resolving to the method call response
 * @note The slash command expects parameters: { cmd: string, params: string, msg: IMessage, triggerId: string }
 */
export const addUserToRoomSlashCommand = ({
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

	return requestInstance
		.post(methodCall('slashCommand'))
		.set(credentialsInstance)
		.send({
			message: JSON.stringify({
				method: 'slashCommand',
				params: [
					{
						cmd: 'invite',
						params: usernames.join(' '),
						msg: {
							rid,
							_id: `test-${Date.now()}`,
						},
						triggerId: `test-trigger-${Date.now()}`,
					},
				],
				id: 'id',
				msg: 'method',
			}),
		});
};

/**
 * Retrieves detailed information about a room.
 *
 * Fetches comprehensive room metadata including federation status,
 * member counts, and other room properties needed for federation testing.
 *
 * @param roomId - The unique identifier of the room
 * @param config - Optional request configuration for custom domains
 * @returns Promise resolving to room information response
 */
export const getRoomInfo = (roomId: IRoom['_id'], config?: IRequestConfig) => {
	const requestInstance = config?.request || request;
	const credentialsInstance = config?.credentials || credentials;

	return new Promise<ReturnType<Endpoints['/v1/rooms.info']['GET']>>((resolve) => {
		void requestInstance
			.get(api('rooms.info'))
			.set(credentialsInstance)
			.query({
				roomId,
			})
			.end((_err: any, req: any) => {
				resolve(req.body);
			});
	});
};

/**
 * Retrieves room members ordered by their role hierarchy.
 *
 * Gets the complete list of room members with their roles and permissions,
 * ordered by importance. Essential for verifying federation member synchronization
 * and role assignments across different Rocket.Chat instances.
 *
 * @param roomId - The unique identifier of the room
 * @param config - Optional request configuration for custom domains
 * @returns Promise resolving to ordered member list response
 */
export const getRoomMembers = (roomId: IRoom['_id'], config?: IRequestConfig) => {
	const requestInstance = config?.request || request;
	const credentialsInstance = config?.credentials || credentials;

	return new Promise<ReturnType<Endpoints['/v1/rooms.membersOrderedByRole']['GET']>>((resolve) => {
		void requestInstance
			.get(api('rooms.membersOrderedByRole'))
			.set(credentialsInstance)
			.query({
				roomId,
			})
			.end((_err: any, req: any) => {
				resolve(req.body);
			});
	});
};

/**
 * Finds a specific room member with configurable retry logic.
 *
 * Searches for a member in a room by username, with retry logic to handle
 * eventual consistency in federated systems. This is crucial for federation
 * testing where member synchronization may take time to propagate.
 *
 * @param roomId - The unique identifier of the room to search
 * @param username - The username to find
 * @param options - Retry configuration options
 * @param options.maxRetries - Maximum number of retry attempts (default: 3)
 * @param options.delay - Delay between retries in milliseconds (default: 1000)
 * @param options.initialDelay - Initial delay before first attempt in milliseconds (default: 0)
 * @param config - Optional request configuration for custom domains
 * @returns Promise resolving to the user object if found, null otherwise
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

	// eslint-disable-next-line no-await-in-loop
	for (let attempt = 1; attempt <= maxRetries; attempt++) {
		try {
			// eslint-disable-next-line no-await-in-loop
			const membersResponse = await getRoomMembers(roomId, config);
			const member = membersResponse.members.find((member: IUser) => member.username === username);

			if (member) {
				return member;
			}

			if (attempt < maxRetries) {
				// eslint-disable-next-line no-await-in-loop
				await new Promise((resolve) => setTimeout(resolve, delay));
			}
		} catch (error) {
			console.warn(`Attempt ${attempt} to find room member failed:`, error);

			if (attempt < maxRetries) {
				// eslint-disable-next-line no-await-in-loop
				await new Promise((resolve) => setTimeout(resolve, delay));
			}
		}
	}

	return null;
};

/**
 * Retrieves the message history for a group/private room.
 *
 * Fetches the complete message history including system messages,
 * user messages, and federation events. Essential for verifying
 * message synchronization and system message generation in federated rooms.
 *
 * @param roomId - The unique identifier of the room
 * @param config - Optional request configuration for custom domains
 * @returns Promise resolving to message history response
 */
export const getGroupHistory = (roomId: IRoom['_id'], config?: IRequestConfig) => {
	const requestInstance = config?.request || request;
	const credentialsInstance = config?.credentials || credentials;

	return new Promise<ReturnType<Endpoints['/v1/groups.history']['GET']>>((resolve) => {
		void requestInstance
			.get(api('groups.history'))
			.set(credentialsInstance)
			.query({
				roomId,
			})
			.end((_err: any, req: any) => {
				resolve(req.body);
			});
	});
};

/**
 * Loads message history for a room using the loadHistory method call.
 *
 * Fetches message history via the DDP method call endpoint, which returns
 * messages with markdown parsing metadata (md attribute). This is useful
 * for testing message rendering and markdown parsing, including emoji handling.
 *
 * @param rid - The unique identifier of the room
 * @param config - Optional request configuration for custom domains
 * @param end - Optional end date to load messages before this timestamp
 * @param limit - Optional limit for number of messages to return (default: 20)
 * @param ls - Optional last seen timestamp for unread calculation
 * @param showThreadMessages - Optional flag to include thread messages (default: true)
 * @returns Promise resolving to message history with structure: { messages, firstUnread?, unreadNotLoaded? }
 */
export const loadHistory = async (
	rid: IRoom['_id'],
	config?: IRequestConfig,
	end?: Date,
	limit?: number,
	ls?: string | Date,
	showThreadMessages?: boolean,
) => {
	const requestInstance = config?.request || request;
	const credentialsInstance = config?.credentials || credentials;

	const params: any[] = [rid];
	if (end !== undefined) {
		params.push(end);
	}
	if (limit !== undefined) {
		params.push(limit);
	}
	if (ls !== undefined) {
		params.push(ls);
	}
	if (showThreadMessages !== undefined) {
		params.push(showThreadMessages);
	}

	const response = await requestInstance
		.post(methodCall('loadHistory'))
		.set(credentialsInstance)
		.send({
			message: JSON.stringify({
				method: 'loadHistory',
				params,
				id: 'id',
				msg: 'method',
			}),
		});

	if (!response.body.success) {
		throw new Error(`loadHistory failed: ${JSON.stringify(response.body)}`);
	}

	const data = JSON.parse(response.body.message);
	if (data.error) {
		throw new Error(`loadHistory method error: ${JSON.stringify(data.error)}`);
	}

	return data.result as {
		messages: IMessage[];
		firstUnread?: IMessage;
		unreadNotLoaded?: number;
	};
};

/**
 * Accepts a room invite for the authenticated user.
 *
 * Processes a room invitation by accepting it, which grants the user
 * access to the room. This is essential for federated room workflows
 * where users receive invitations rather than auto-joining.
 *
 * @param roomId - The unique identifier of the room
 * @param config - Optional request configuration for custom domains
 * @returns Promise resolving to the acceptance response
 */
export const acceptRoomInvite = (roomId: IRoom['_id'], config?: IRequestConfig) => {
	const requestInstance = config?.request || request;
	const credentialsInstance = config?.credentials || credentials;

	return new Promise<{ success: boolean; error?: string }>((resolve) => {
		void requestInstance
			.post(api('rooms.invite'))
			.set(credentialsInstance)
			.send({
				roomId,
				action: 'accept',
			})
			.end((_err: any, req: any) => {
				resolve(req.body);
			});
	});
};

/**
 * Retrieves the subscriptions for the authenticated user.
 *
 * Fetches the complete list of subscriptions for the authenticated user, which is essential
 * for verifying federation subscription synchronization and member synchronization.
 *
 * @param config - Optional request configuration for custom domains
 * @returns Promise resolving to the subscriptions response
 */

export const getSubscriptions = (config?: IRequestConfig) => {
	const requestInstance = config?.request || request;
	const credentialsInstance = config?.credentials || credentials;

	return new Promise<ReturnType<Endpoints['/v1/subscriptions.get']['GET']>>((resolve) => {
		void requestInstance
			.get(api('subscriptions.get'))
			.set(credentialsInstance)
			.end((_err: any, req: any) => {
				resolve(req.body);
			});
	});
};

/**
 * Rejects a room invite for the authenticated user.
 *
 * Processes a room invitation by rejecting it, which prevents the user
 * from joining the room and removes them from the invited members list.
 * This is essential for federated room workflows where users can decline invitations.
 *
 * @param roomId - The unique identifier of the room
 * @param config - Optional request configuration for custom domains
 * @returns Promise resolving to the rejection response
 */
export const rejectRoomInvite = (roomId: IRoom['_id'], config?: IRequestConfig) => {
	const requestInstance = config?.request || request;
	const credentialsInstance = config?.credentials || credentials;

	return new Promise<{ success: boolean; error?: string }>((resolve) => {
		void requestInstance
			.post(api('rooms.invite'))
			.set(credentialsInstance)
			.send({
				roomId,
				action: 'reject',
			})
			.end((_err: any, req: any) => {
				resolve(req.body);
			});
	});
};
