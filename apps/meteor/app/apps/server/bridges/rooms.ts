import type { IAppServerOrchestrator } from '@rocket.chat/apps';
import type { IMessage, IMessageRaw } from '@rocket.chat/apps-engine/definition/messages';
import type { IRoom } from '@rocket.chat/apps-engine/definition/rooms';
import { RoomType } from '@rocket.chat/apps-engine/definition/rooms';
import type { IUser } from '@rocket.chat/apps-engine/definition/users';
import type { GetMessagesOptions } from '@rocket.chat/apps-engine/server/bridges/RoomBridge';
import { RoomBridge } from '@rocket.chat/apps-engine/server/bridges/RoomBridge';
import type { ISubscription, IUser as ICoreUser, IRoom as ICoreRoom, IMessage as ICoreMessage } from '@rocket.chat/core-typings';
import { Subscriptions, Users, Rooms, Messages } from '@rocket.chat/models';
import type { FindOptions, Sort } from 'mongodb';

import { createDirectMessage } from '../../../../server/methods/createDirectMessage';
import { createDiscussion } from '../../../discussion/server/methods/createDiscussion';
import { addUserToRoom } from '../../../lib/server/functions/addUserToRoom';
import { deleteRoom } from '../../../lib/server/functions/deleteRoom';
import { removeUserFromRoom } from '../../../lib/server/functions/removeUserFromRoom';
import { createChannelMethod } from '../../../lib/server/methods/createChannel';
import { createPrivateGroupMethod } from '../../../lib/server/methods/createPrivateGroup';

export class AppRoomBridge extends RoomBridge {
	constructor(private readonly orch: IAppServerOrchestrator) {
		super();
	}

	protected async create(room: IRoom, members: Array<string>, appId: string): Promise<string> {
		this.orch.debugLog(`The App ${appId} is creating a new room.`, room);

		const rcRoom = await this.orch.getConverters()?.get('rooms').convertAppRoom(room);

		switch (room.type) {
			case RoomType.CHANNEL:
				return this.createChannel(room.creator.id, rcRoom, members);
			case RoomType.PRIVATE_GROUP:
				return this.createPrivateGroup(room.creator.id, rcRoom, members);
			case RoomType.DIRECT_MESSAGE:
				return this.createDirectMessage(room.creator.id, members);
			default:
				throw new Error('Only channels, private groups and direct messages can be created.');
		}
	}

	private prepareExtraData(room: Record<string, any>): Record<string, unknown> {
		const extraData = Object.assign({}, room);
		delete extraData.name;
		delete extraData.t;
		delete extraData.ro;
		delete extraData.customFields;

		return extraData;
	}

	private async createChannel(userId: string, room: ICoreRoom, members: string[]): Promise<string> {
		return (await createChannelMethod(userId, room.name || '', members, room.ro, room.customFields, this.prepareExtraData(room))).rid;
	}

	private async createDirectMessage(userId: string, members: string[]): Promise<string> {
		return (await createDirectMessage(members, userId)).rid;
	}

	private async createPrivateGroup(userId: string, room: ICoreRoom, members: string[]): Promise<string> {
		const user = await Users.findOneById(userId);
		if (!user) {
			throw new Error('Invalid user');
		}
		return (await createPrivateGroupMethod(user, room.name || '', members, room.ro, room.customFields, this.prepareExtraData(room))).rid;
	}

	protected async getById(roomId: string, appId: string): Promise<IRoom> {
		this.orch.debugLog(`The App ${appId} is getting the roomById: "${roomId}"`);

		// #TODO: #AppsEngineTypes - Remove explicit types and typecasts once the apps-engine definition/implementation mismatch is fixed.
		const promise: Promise<IRoom | undefined> = this.orch.getConverters()?.get('rooms').convertById(roomId);
		return promise as Promise<IRoom>;
	}

	protected async getByName(roomName: string, appId: string): Promise<IRoom> {
		this.orch.debugLog(`The App ${appId} is getting the roomByName: "${roomName}"`);

		// #TODO: #AppsEngineTypes - Remove explicit types and typecasts once the apps-engine definition/implementation mismatch is fixed.
		const promise: Promise<IRoom | undefined> = this.orch.getConverters()?.get('rooms').convertByName(roomName);
		return promise as Promise<IRoom>;
	}

	protected async getCreatorById(roomId: string, appId: string): Promise<IUser | undefined> {
		this.orch.debugLog(`The App ${appId} is getting the room's creator by id: "${roomId}"`);

		const room = await Rooms.findOneById(roomId);

		if (!room?.u?._id) {
			return undefined;
		}

		return this.orch.getConverters()?.get('users').convertById(room.u._id);
	}

	protected async getCreatorByName(roomName: string, appId: string): Promise<IUser | undefined> {
		this.orch.debugLog(`The App ${appId} is getting the room's creator by name: "${roomName}"`);

		const room = await Rooms.findOneByName(roomName, {});

		if (!room?.u?._id) {
			return undefined;
		}

		return this.orch.getConverters()?.get('users').convertById(room.u._id);
	}

	protected async getMessages(roomId: string, options: GetMessagesOptions, appId: string): Promise<IMessageRaw[]> {
		this.orch.debugLog(`The App ${appId} is getting the messages of the room: "${roomId}" with options:`, options);

		const { limit, skip = 0, sort: _sort, showThreadMessages } = options;

		const messageConverter = this.orch.getConverters()?.get('messages');
		if (!messageConverter) {
			throw new Error('Message converter not found');
		}

		const threadFilterQuery = showThreadMessages ? {} : { tmid: { $exists: false } };

		// We support only one field for now
		const sort: Sort | undefined = _sort?.createdAt ? { ts: _sort.createdAt } : undefined;

		const messageQueryOptions: FindOptions<ICoreMessage> = {
			limit,
			skip,
			sort,
		};

		const query = {
			rid: roomId,
			_hidden: { $ne: true },
			t: { $exists: false },
			...threadFilterQuery,
		};

		const cursor = Messages.find(query, messageQueryOptions);

		const messagePromises: Promise<IMessageRaw>[] = await cursor.map((message) => messageConverter.convertMessageRaw(message)).toArray();

		return Promise.all(messagePromises);
	}

	protected async getMembers(roomId: string, appId: string): Promise<Array<IUser>> {
		this.orch.debugLog(`The App ${appId} is getting the room's members by room id: "${roomId}"`);
		const subscriptions = await Subscriptions.findByRoomId(roomId, {});
		// #TODO: #AppsEngineTypes - Remove explicit types and typecasts once the apps-engine definition/implementation mismatch is fixed.
		const promises: Promise<(IUser | undefined)[]> = Promise.all(
			(await subscriptions.toArray()).map((sub: ISubscription) => this.orch.getConverters()?.get('users').convertById(sub.u?._id)),
		);

		return promises as Promise<IUser[]>;
	}

	protected async getDirectByUsernames(usernames: Array<string>, appId: string): Promise<IRoom | undefined> {
		this.orch.debugLog(`The App ${appId} is getting direct room by usernames: "${usernames}"`);
		const room = await Rooms.findDirectRoomContainingAllUsernames(usernames, {});
		if (!room) {
			return undefined;
		}
		return this.orch.getConverters()?.get('rooms').convertRoom(room);
	}

	protected async update(room: IRoom, members: Array<string> = [], appId: string): Promise<void> {
		this.orch.debugLog(`The App ${appId} is updating a room.`);

		const rm = await this.orch.getConverters()?.get('rooms').convertAppRoom(room, true);

		const updateResult = await Rooms.updateOne({ _id: room.id }, { $set: rm });

		if (!updateResult.matchedCount) {
			throw new Error('Room id not found');
		}

		for await (const username of members) {
			const member = await Users.findOneByUsername(username, {});

			if (!member) {
				continue;
			}

			await addUserToRoom(room.id, member);
		}
	}

	protected async delete(roomId: string, appId: string): Promise<void> {
		this.orch.debugLog(`The App ${appId} is deleting a room.`);
		await deleteRoom(roomId);
	}

	protected async createDiscussion(
		room: IRoom,
		parentMessage: IMessage | undefined = undefined,
		reply: string | undefined = '',
		members: Array<string> = [],
		appId: string,
	): Promise<string> {
		this.orch.debugLog(`The App ${appId} is creating a new discussion.`, room);

		const rcRoom = await this.orch.getConverters()?.get('rooms').convertAppRoom(room);

		let rcMessage;
		if (parentMessage) {
			rcMessage = await this.orch.getConverters()?.get('messages').convertAppMessage(parentMessage);
		}

		if (!rcRoom.prid || !(await Rooms.findOneById(rcRoom.prid))) {
			throw new Error('There must be a parent room to create a discussion.');
		}

		// #TODO: #AppsEngineTypes - Remove explicit types and typecasts once the apps-engine definition/implementation mismatch is fixed.
		const discussion = {
			prid: rcRoom.prid,
			t_name: rcRoom.fname as string,
			pmid: rcMessage ? rcMessage._id : undefined,
			reply: reply && reply.trim() !== '' ? reply : undefined,
			users: members.length > 0 ? members : [],
		};

		const { rid } = await createDiscussion(room.creator.id, discussion);

		return rid;
	}

	protected getModerators(roomId: string, appId: string): Promise<IUser[]> {
		this.orch.debugLog(`The App ${appId} is getting room moderators for room id: ${roomId}`);
		return this.getUsersByRoomIdAndSubscriptionRole(roomId, 'moderator');
	}

	protected getOwners(roomId: string, appId: string): Promise<IUser[]> {
		this.orch.debugLog(`The App ${appId} is getting room owners for room id: ${roomId}`);
		return this.getUsersByRoomIdAndSubscriptionRole(roomId, 'owner');
	}

	protected getLeaders(roomId: string, appId: string): Promise<IUser[]> {
		this.orch.debugLog(`The App ${appId} is getting room leaders for room id: ${roomId}`);
		return this.getUsersByRoomIdAndSubscriptionRole(roomId, 'leader');
	}

	private async getUsersByRoomIdAndSubscriptionRole(roomId: string, role: string): Promise<IUser[]> {
		const subs = (await Subscriptions.findByRoomIdAndRoles(roomId, [role], {
			projection: { uid: '$u._id', _id: 0 },
		}).toArray()) as unknown as {
			uid: string;
		}[];
		// Was this a bug?
		const users = await Users.findByIds(subs.map((user: { uid: string }) => user.uid)).toArray();
		const userConverter = this.orch.getConverters().get('users');
		return users.map((user: ICoreUser) => userConverter.convertToApp(user));
	}

	protected async getUnreadByUser(roomId: string, uid: string, options: GetMessagesOptions, appId: string): Promise<Array<IMessageRaw>> {
		this.orch.debugLog(`The App ${appId} is getting the unread messages for the user: "${uid}" in the room: "${roomId}"`);

		const messageConverter = this.orch.getConverters()?.get('messages');
		if (!messageConverter) {
			throw new Error('Message converter not found');
		}

		const subscription = await Subscriptions.findOneByRoomIdAndUserId(roomId, uid, { projection: { ls: 1 } });

		if (!subscription) {
			const errorMessage = `No subscription found for user with ID "${uid}" in room with ID "${roomId}". This means the user is not subscribed to the room.`;
			this.orch.debugLog(errorMessage);
			throw new Error('User not subscribed to room');
		}

		const lastSeen = subscription?.ls;
		if (!lastSeen) {
			return [];
		}

		const sort: Sort = options.sort?.createdAt ? { ts: options.sort.createdAt } : { ts: 1 };

		const cursor = Messages.findVisibleByRoomIdBetweenTimestampsNotContainingTypes(
			roomId,
			lastSeen,
			new Date(),
			[],
			{
				limit: options.limit,
				skip: options.skip,
				sort,
			},
			options.showThreadMessages,
		);

		const messages = await cursor.toArray();
		return Promise.all(messages.map((msg) => messageConverter.convertMessageRaw(msg)));
	}

	protected async getUserUnreadMessageCount(roomId: string, uid: string, appId: string): Promise<number> {
		this.orch.debugLog(`The App ${appId} is getting the unread messages count of the room: "${roomId}" for the user: "${uid}"`);

		const subscription = await Subscriptions.findOneByRoomIdAndUserId(roomId, uid, { projection: { ls: 1 } });

		if (!subscription) {
			const errorMessage = `No subscription found for user with ID "${uid}" in room with ID "${roomId}". This means the user is not subscribed to the room.`;
			this.orch.debugLog(errorMessage);
			throw new Error('User not subscribed to room');
		}

		const lastSeen = subscription?.ls;
		if (!lastSeen) {
			return 0;
		}

		return Messages.countVisibleByRoomIdBetweenTimestampsNotContainingTypes(roomId, lastSeen, new Date(), []);
	}

	protected async removeUsers(roomId: string, usernames: Array<string>, appId: string): Promise<void> {
		this.orch.debugLog(`The App ${appId} is removing users ${usernames} from room id: ${roomId}`);
		if (!roomId) {
			throw new Error('roomId was not provided.');
		}

		const members = await Users.findUsersByUsernames(usernames, { limit: 50 }).toArray();
		await Promise.all(members.map((user) => removeUserFromRoom(roomId, user)));
	}
}
