import { AppEvents, Apps } from '@rocket.chat/apps';
import { AppsEngineException } from '@rocket.chat/apps-engine/definition/exceptions';
import { FederationMatrix, Message, Room, Team } from '@rocket.chat/core-services';
import type { ICreateRoomParams, ISubscriptionExtraData } from '@rocket.chat/core-services';
import type { ICreatedRoom, IUser, IRoom, RoomType } from '@rocket.chat/core-typings';
import { Rooms, Subscriptions, Users } from '@rocket.chat/models';
import { Meteor } from 'meteor/meteor';

import { createDirectRoom } from './createDirectRoom';
import { calculateRoomRolePriorityFromRoles } from '../../../../lib/roles/calculateRoomRolePriorityFromRoles';
import { callbacks } from '../../../../server/lib/callbacks';
import { beforeAddUserToRoom } from '../../../../server/lib/callbacks/beforeAddUserToRoom';
import { beforeCreateRoomCallback, prepareCreateRoomCallback } from '../../../../server/lib/callbacks/beforeCreateRoomCallback';
import { getSubscriptionAutotranslateDefaultConfig } from '../../../../server/lib/getSubscriptionAutotranslateDefaultConfig';
import { syncRoomRolePriorityForUserAndRoom } from '../../../../server/lib/roles/syncRoomRolePriority';
import { hasPermissionAsync } from '../../../authorization/server/functions/hasPermission';
import { getDefaultSubscriptionPref } from '../../../utils/lib/getDefaultSubscriptionPref';
import { getValidRoomName } from '../../../utils/server/lib/getValidRoomName';
import { notifyOnRoomChanged, notifyOnSubscriptionChangedById } from '../lib/notifyListener';

const isValidName = (name: unknown): name is string => {
	return typeof name === 'string' && name.trim().length > 0;
};

const onlyUsernames = (members: unknown): members is string[] =>
	Array.isArray(members) && members.every((member) => typeof member === 'string');

async function createUsersSubscriptions({
	room,
	shouldBeHandledByFederation,
	members,
	now,
	owner,
	options,
}: {
	room: IRoom;
	shouldBeHandledByFederation: boolean;
	members: string[];
	now: Date;
	owner: IUser;
	options?: ICreateRoomParams['options'];
}) {
	if (shouldBeHandledByFederation) {
		const extra: Partial<ISubscriptionExtraData> = {
			...options?.subscriptionExtra,
			open: true,
			ls: now,
			roles: ['owner'],
			...(room.prid && { prid: room.prid }),
			...getDefaultSubscriptionPref(owner),
		};

		const { insertedId } = await Subscriptions.createWithRoomAndUser(room, owner, extra);
		await syncRoomRolePriorityForUserAndRoom(owner._id, room._id, ['owner']);

		if (insertedId) {
			await notifyOnSubscriptionChangedById(insertedId, 'inserted');
			await notifyOnRoomChanged(room, 'inserted');
		}

		// Invite federated members to the room SYNCRONOUSLY,
		// since we do not use to invite lots of users at once, this is acceptable.
		const membersToInvite = members.filter((m) => m !== owner.username);

		await FederationMatrix.ensureFederatedUsersExistLocally(membersToInvite);

		for await (const memberUsername of membersToInvite) {
			const member = await Users.findOneByUsername(memberUsername);
			if (!member) {
				throw new Error('Federated user not found locally');
			}

			await Room.createUserSubscription({
				ts: new Date(),
				room,
				userToBeAdded: member,
				inviter: owner,
				status: 'INVITED',
			});
		}

		return;
	}

	const subs = [];

	const memberIds = [];

	const memberIdAndRolePriorityMap: Record<IUser['_id'], number> = {};

	const membersCursor = Users.findUsersByUsernames(members);

	// TODO: Check re new federation-service - should we add them here or keep on createRoom inside of homeserver?!
	for await (const member of membersCursor) {
		try {
			await beforeAddUserToRoom.run({ user: member, inviter: owner }, room);
			await callbacks.run('beforeAddedToRoom', { user: member, inviter: owner });
		} catch (error) {
			continue;
		}

		memberIds.push(member._id);

		const extra: Partial<ISubscriptionExtraData> = { open: true, ...options?.subscriptionExtra };

		if (room.prid) {
			extra.prid = room.prid;
		}

		if (member.username === owner.username) {
			extra.ls = now;
			extra.roles = ['owner'];
		}

		const autoTranslateConfig = getSubscriptionAutotranslateDefaultConfig(member);

		subs.push({
			user: member,
			extraData: {
				...extra,
				...autoTranslateConfig,
				...getDefaultSubscriptionPref(member),
			},
		});

		if (extra.roles) {
			memberIdAndRolePriorityMap[member._id] = calculateRoomRolePriorityFromRoles(extra.roles);
		}
	}

	if (!['d', 'l'].includes(room.t)) {
		await Users.addRoomByUserIds(memberIds, room._id);
	}

	const { insertedIds } = await Subscriptions.createWithRoomAndManyUsers(room, subs);
	await Users.assignRoomRolePrioritiesByUserIdPriorityMap(memberIdAndRolePriorityMap, room._id);

	Object.values(insertedIds).forEach((subId) => notifyOnSubscriptionChangedById(subId, 'inserted'));

	await Rooms.incUsersCountById(room._id, subs.length);
}

// eslint-disable-next-line complexity
export const createRoom = async <T extends RoomType>(
	type: T,
	name: T extends 'd' ? undefined : string,
	owner: T extends 'd' ? IUser | undefined : IUser,
	members: T extends 'd' ? IUser[] : string[] = [],
	excludeSelf?: boolean,
	readOnly?: boolean,
	roomExtraData?: Partial<IRoom>,
	options?: ICreateRoomParams['options'],
): Promise<
	ICreatedRoom & {
		rid: string;
	}
> => {
	const { teamId, ...extraData } = roomExtraData || ({} as IRoom);

	// TODO: use a shared helper to check whether a user is federated
	const hasFederatedMembers = members.some((member) => {
		if (typeof member === 'string') {
			return member.includes(':') && member.includes('@');
		}
		return member.username?.includes(':') && member.username?.includes('@');
	});

	// Prevent adding federated users to rooms that are not marked as federated explicitly
	if (hasFederatedMembers && extraData.federated !== true) {
		throw new Meteor.Error('error-federated-users-in-non-federated-rooms', 'Cannot add federated users to non-federated rooms', {
			method: 'createRoom',
		});
	}

	await prepareCreateRoomCallback.run({
		type,
		// name,
		// owner: ownerUsername,
		// members,
		// readOnly,
		extraData,
		// options,
	});

	const shouldBeHandledByFederation = extraData.federated === true;

	if (shouldBeHandledByFederation && owner && !(await hasPermissionAsync(owner._id, 'access-federation'))) {
		throw new Meteor.Error('error-not-authorized-federation', 'Not authorized to access federation', {
			method: 'createRoom',
		});
	}

	if (type === 'd') {
		return createDirectRoom(members as IUser[], extraData, { ...options, creator: options?.creator || owner?._id });
	}

	if (!onlyUsernames(members)) {
		throw new Meteor.Error(
			'error-invalid-members',
			'members should be an array of usernames if provided for rooms other than direct messages',
		);
	}

	if (!isValidName(name)) {
		throw new Meteor.Error('error-invalid-name', 'Invalid name', {
			function: 'RocketChat.createRoom',
		});
	}

	if (!owner) {
		throw new Meteor.Error('error-invalid-user', 'Invalid user', {
			function: 'RocketChat.createRoom',
		});
	}

	if (!owner?.username) {
		throw new Meteor.Error('error-invalid-user', 'Invalid user', {
			function: 'RocketChat.createRoom',
		});
	}

	if (!excludeSelf && owner.username && !members.includes(owner.username)) {
		members.push(owner.username);
	}

	if (extraData.broadcast) {
		readOnly = true;
		delete extraData.reactWhenReadOnly;
	}

	// this might not be the best way to check if the room is a discussion, we may need a specific field for that
	const isDiscussion = 'prid' in extraData && extraData.prid !== '';

	const now = new Date();

	const roomProps: Omit<IRoom, '_id' | '_updatedAt'> = {
		fname: name,
		_updatedAt: now,
		...extraData,
		name: isDiscussion ? name : await getValidRoomName(name.trim(), undefined),
		t: type,
		msgs: 0,
		usersCount: 0,
		u: {
			_id: owner._id,
			username: owner.username,
			name: owner.name,
		},
		ts: now,
		ro: readOnly === true,
	};

	if (teamId) {
		const team = await Team.getOneById(teamId, { projection: { _id: 1 } });
		if (team) {
			roomProps.teamId = team._id;
		}
	}

	const tmp = {
		...roomProps,
		_USERNAMES: members,
	};

	const prevent = await Apps.self?.triggerEvent(AppEvents.IPreRoomCreatePrevent, tmp).catch((error) => {
		if (error.name === AppsEngineException.name) {
			throw new Meteor.Error('error-app-prevented', error.message);
		}

		throw error;
	});

	if (prevent) {
		throw new Meteor.Error('error-app-prevented', 'A Rocket.Chat App prevented the room creation.');
	}

	const eventResult = await Apps.self?.triggerEvent(
		AppEvents.IPreRoomCreateModify,
		await Apps.triggerEvent(AppEvents.IPreRoomCreateExtend, tmp),
	);

	if (eventResult && typeof eventResult === 'object' && delete eventResult._USERNAMES) {
		Object.assign(roomProps, eventResult);
	}

	await beforeCreateRoomCallback.run({
		owner,
		room: roomProps,
	});

	if (type === 'c') {
		await callbacks.run('beforeCreateChannel', owner, roomProps);
	}

	const room = await Rooms.createWithFullRoomData(roomProps);

	void notifyOnRoomChanged(room, 'inserted');

	// If federated, we must create Matrix room BEFORE subscriptions so invites can be sent.
	if (shouldBeHandledByFederation) {
		// Reusing unused callback to create Matrix room.
		// We should discuss the opportunity to rename it to something with "before" prefix.
		await callbacks.run('federation.afterCreateFederatedRoom', room, { owner, originalMemberList: members, options });
	}

	await createUsersSubscriptions({ room, members, now, owner, options, shouldBeHandledByFederation });

	if (type === 'c') {
		if (room.teamId) {
			const team = await Team.getOneById(room.teamId);
			if (team) {
				await Message.saveSystemMessage('user-added-room-to-team', team.roomId, room.name || '', owner);
			}
		}
		callbacks.runAsync('afterCreateChannel', owner, room);
	} else if (type === 'p') {
		callbacks.runAsync('afterCreatePrivateGroup', owner, room);
	}
	callbacks.runAsync('afterCreateRoom', owner, room);

	void Apps.self?.triggerEvent(AppEvents.IPostRoomCreate, room);
	return {
		rid: room._id, // backwards compatible
		inserted: true,
		...room,
	};
};
