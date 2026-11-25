import { AppEvents, Apps } from '@rocket.chat/apps';
import { AppsEngineException } from '@rocket.chat/apps-engine/definition/exceptions';
import { ClientSafeError } from '@rocket.chat/core-services';
import type { ISubscriptionExtraData } from '@rocket.chat/core-services';
import type { ICreatedRoom, IRoom, ISubscription, IUser } from '@rocket.chat/core-typings';
import { Rooms, Subscriptions, Users } from '@rocket.chat/models';
import { Random } from '@rocket.chat/random';
import { isTruthy } from '@rocket.chat/tools';
import type { MatchKeysAndValues } from 'mongodb';

import { getNameForDMs } from '../../services/room/getNameForDMs';
import { settings } from '../../settings';
import { callbacks } from '../callbacks';
import { notifyOnRoomChangedById, notifyOnSubscriptionChangedByRoomIdAndUserId } from '../notifyListener';
import { getDefaultSubscriptionPref } from '../utils/lib/getDefaultSubscriptionPref';

const generateSubscription = (
	fname: string,
	name: string,
	user: IUser,
	extra: MatchKeysAndValues<ISubscription>,
): MatchKeysAndValues<ISubscription> => ({
	_id: Random.id(),
	ts: new Date(),
	alert: false,
	unread: 0,
	userMentions: 0,
	groupMentions: 0,
	...(user.customFields && { customFields: user.customFields }),
	...getDefaultSubscriptionPref(user),
	...extra,
	t: 'd',
	fname,
	name,
	u: {
		_id: user._id,
		username: user.username,
	},
});

async function applyPreRoomCreateAppEvents<T extends object>(roomInfo: T, usernames: string[]): Promise<void> {
	const tmpRoom: { _USERNAMES?: (string | undefined)[] } & T = {
		...roomInfo,
		_USERNAMES: usernames,
	};

	const prevent = await Apps.self?.triggerEvent(AppEvents.IPreRoomCreatePrevent, tmpRoom).catch((error) => {
		if (error.name === AppsEngineException.name) {
			throw new ClientSafeError('error-app-prevented', error.message);
		}

		throw error;
	});

	if (prevent) {
		throw new ClientSafeError('error-app-prevented', 'A Rocket.Chat App prevented the room creation.');
	}

	const result = await Apps.self?.triggerEvent(
		AppEvents.IPreRoomCreateModify,
		await Apps.self?.triggerEvent(AppEvents.IPreRoomCreateExtend, tmpRoom),
	);

	if (typeof result === 'object') {
		Object.assign(roomInfo, result);
	}

	delete tmpRoom._USERNAMES;
}

async function upsertSelfDirectSubscription(rid: IRoom['_id'], member: IUser, subscriptionExtra?: ISubscriptionExtraData): Promise<void> {
	const { modifiedCount, upsertedCount } = await Subscriptions.updateOne(
		{ rid, 'u._id': member._id },
		{
			$set: { open: true },
			// oxlint-disable-next-line @typescript-eslint/no-non-null-assertion
			$setOnInsert: generateSubscription(member.name! || member.username!, member.username!, member, {
				...subscriptionExtra,
			}),
		},
		{ upsert: true },
	);
	if (modifiedCount || upsertedCount) {
		void notifyOnSubscriptionChangedByRoomIdAndUserId(rid, member._id, modifiedCount ? 'updated' : 'inserted');
	}
}

async function upsertMembersDirectSubscriptions(
	rid: IRoom['_id'],
	roomMembers: IUser[],
	membersCount: number,
	roomExtraData: Partial<IRoom>,
	options: {
		creator?: IUser['_id'];
		subscriptionExtra?: ISubscriptionExtraData;
	},
): Promise<void> {
	const memberIds = roomMembers.map((member) => member._id);
	const membersWithPreferences: IUser[] = await Users.find(
		{ _id: { $in: memberIds } },
		{ projection: { 'username': 1, 'settings.preferences': 1 } },
	).toArray();

	const creatorUser = roomMembers.find((member) => member._id === options?.creator);
	if (roomExtraData.federated && !creatorUser) {
		throw new ClientSafeError('error-creator-not-in-room', 'The creator user must be part of the direct room');
	}

	const roomNames = getNameForDMs(roomMembers);

	for (const member of membersWithPreferences) {
		const subscriptionStatus: Partial<ISubscription> =
			roomExtraData.federated && options.creator !== member._id && creatorUser?.username
				? {
						status: 'INVITED',
						inviter: {
							_id: creatorUser._id,
							username: creatorUser.username,
							name: creatorUser.name,
						},
						open: true,
						unread: 1,
						userMentions: 1,
					}
				: {};

		const { fname, name } = roomNames[member._id];

		const { modifiedCount, upsertedCount } = await Subscriptions.updateOne(
			{ rid, 'u._id': member._id },
			{
				...(options?.creator === member._id && { $set: { open: true } }),
				$setOnInsert: generateSubscription(fname, name, member, {
					...(options?.creator !== member._id && { open: membersCount > 2 }),
					...options?.subscriptionExtra,
					...subscriptionStatus,
					...(roomExtraData.federated && member._id === options?.creator && { roles: ['owner'] }),
				}),
			},
			{ upsert: true },
		);
		if (modifiedCount || upsertedCount) {
			void notifyOnSubscriptionChangedByRoomIdAndUserId(rid, member._id, modifiedCount ? 'updated' : 'inserted');
		}
	}
}

export async function createDirectRoom(
	members: IUser[] | string[],
	roomExtraData: Partial<IRoom> = {},
	options: {
		forceNew?: boolean;
		creator?: IUser['_id'];
		subscriptionExtra?: ISubscriptionExtraData;
	},
): Promise<ICreatedRoom> {
	const maxUsers = settings.get<number>('DirectMesssage_maxUsers') || 1;
	if (members.length > maxUsers) {
		throw new ClientSafeError(
			'error-direct-message-max-user-exceeded',
			`You cannot add more than ${maxUsers} users, including yourself to a direct message`,
			{
				method: 'createDirectRoom',
			},
		);
	}

	const membersUsernames: string[] = members
		.map((member) => {
			if (typeof member === 'string') {
				return member;
			}
			return member.username;
		})
		.filter(isTruthy);

	await callbacks.run('beforeCreateDirectRoom', membersUsernames, roomExtraData);

	const roomMembers = await Users.findUsersByUsernames(membersUsernames).toArray();

	// oxlint-disable-next-line @typescript-eslint/no-non-null-assertion
	const sortedMembers = roomMembers.sort((u1, u2) => (u1.name! || u1.username!).localeCompare(u2.name! || u2.username!));

	const usernames: string[] = sortedMembers.map(({ username }) => username as string).filter(Boolean);
	const uids = roomMembers.map(({ _id }) => _id).sort();

	// Deprecated: using users' _id to compose the room _id is deprecated
	// No projection: the full room is spread into the ICreatedRoom returned below.
	const room: IRoom | null = options?.forceNew ? null : await Rooms.findOneDirectRoomContainingAllUserIDs(uids);

	const isNewRoom = !room;

	// Mirror setUserActiveStatus: a 1-on-1 DM containing a deactivated user is read-only
	const isReadOnlyForDeactivatedMember = uids.length === 2 && roomMembers.some((member) => member.active === false);

	const roomInfo = {
		t: 'd',
		usernames,
		usersCount: members.length,
		msgs: 0,
		ts: new Date(),
		uids,
		...roomExtraData,
		...(isReadOnlyForDeactivatedMember && { ro: true, reactWhenReadOnly: false }),
	};

	if (isNewRoom) {
		await applyPreRoomCreateAppEvents(roomInfo, usernames);
	}

	// @ts-expect-error - TODO: room expects `u` to be passed, but it's not part of the original object in here
	const rid = room?._id || (await Rooms.insertOne(roomInfo)).insertedId;

	void notifyOnRoomChangedById(rid, isNewRoom ? 'inserted' : 'updated');

	if (roomMembers.length === 1) {
		// dm to yourself
		await upsertSelfDirectSubscription(rid, roomMembers[0], options?.subscriptionExtra);
	} else {
		await upsertMembersDirectSubscriptions(rid, roomMembers, members.length, roomExtraData, options);
	}
	// If the room is new, run a callback
	if (isNewRoom) {
		const insertedRoom = await Rooms.findOneById(rid);

		await callbacks.run('afterCreateDirectRoom', insertedRoom, {
			members: roomMembers,
			creatorId: options?.creator,
		});

		void Apps.self?.triggerEvent(AppEvents.IPostRoomCreate, insertedRoom);
	}

	return {
		// oxlint-disable-next-line @typescript-eslint/no-non-null-assertion
		...room!,
		_id: String(rid),
		usernames,
		t: 'd',
		rid,
		inserted: isNewRoom,
	};
}
