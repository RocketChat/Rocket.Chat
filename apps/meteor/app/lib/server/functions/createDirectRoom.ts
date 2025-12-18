import { AppEvents, Apps } from '@rocket.chat/apps';
import { AppsEngineException } from '@rocket.chat/apps-engine/definition/exceptions';
import type { ISubscriptionExtraData } from '@rocket.chat/core-services';
import type { ICreatedRoom, IRoom, ISubscription, IUser } from '@rocket.chat/core-typings';
import { Rooms, Subscriptions, Users } from '@rocket.chat/models';
import { Random } from '@rocket.chat/random';
import { Meteor } from 'meteor/meteor';
import type { MatchKeysAndValues } from 'mongodb';

import { isTruthy } from '../../../../lib/isTruthy';
import { callbacks } from '../../../../server/lib/callbacks';
import { getNameForDMs } from '../../../../server/services/room/getNameForDMs';
import { settings } from '../../../settings/server';
import { getDefaultSubscriptionPref } from '../../../utils/lib/getDefaultSubscriptionPref';
import { notifyOnRoomChangedById, notifyOnSubscriptionChangedByRoomIdAndUserId } from '../lib/notifyListener';

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
		throw new Meteor.Error(
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

	// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
	const sortedMembers = roomMembers.sort((u1, u2) => (u1.name! || u1.username!).localeCompare(u2.name! || u2.username!));

	const usernames: string[] = sortedMembers.map(({ username }) => username as string).filter(Boolean);
	const uids = roomMembers.map(({ _id }) => _id).sort();

	// Deprecated: using users' _id to compose the room _id is deprecated
	const room: IRoom | null = options?.forceNew ? null : await Rooms.findOneDirectRoomContainingAllUserIDs(uids, { projection: { _id: 1 } });

	const isNewRoom = !room;

	const roomInfo = {
		t: 'd',
		usernames,
		usersCount: members.length,
		msgs: 0,
		ts: new Date(),
		uids,
		...roomExtraData,
	};

	if (isNewRoom) {
		const tmpRoom: { _USERNAMES?: (string | undefined)[] } & typeof roomInfo = {
			...roomInfo,
			_USERNAMES: usernames,
		};

		const prevent = await Apps.self?.triggerEvent(AppEvents.IPreRoomCreatePrevent, tmpRoom).catch((error) => {
			if (error.name === AppsEngineException.name) {
				throw new Meteor.Error('error-app-prevented', error.message);
			}

			throw error;
		});

		if (prevent) {
			throw new Meteor.Error('error-app-prevented', 'A Rocket.Chat App prevented the room creation.');
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

	// @ts-expect-error - TODO: room expects `u` to be passed, but it's not part of the original object in here
	const rid = room?._id || (await Rooms.insertOne(roomInfo)).insertedId;

	void notifyOnRoomChangedById(rid, isNewRoom ? 'inserted' : 'updated');

	if (roomMembers.length === 1) {
		// dm to yourself
		const { modifiedCount, upsertedCount } = await Subscriptions.updateOne(
			{ rid, 'u._id': roomMembers[0]._id },
			{
				$set: { open: true },
				// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
				$setOnInsert: generateSubscription(roomMembers[0].name! || roomMembers[0].username!, roomMembers[0].username!, roomMembers[0], {
					...options?.subscriptionExtra,
				}),
			},
			{ upsert: true },
		);
		if (modifiedCount || upsertedCount) {
			void notifyOnSubscriptionChangedByRoomIdAndUserId(rid, roomMembers[0]._id, modifiedCount ? 'updated' : 'inserted');
		}
	} else {
		const memberIds = roomMembers.map((member) => member._id);
		const membersWithPreferences: IUser[] = await Users.find(
			{ _id: { $in: memberIds } },
			{ projection: { 'username': 1, 'settings.preferences': 1 } },
		).toArray();

		const creatorUser = roomMembers.find((member) => member._id === options?.creator);
		if (roomExtraData.federated && !creatorUser) {
			throw new Meteor.Error('error-creator-not-in-room', 'The creator user must be part of the direct room');
		}

		const roomNames = getNameForDMs(roomMembers);

		for await (const member of membersWithPreferences) {
			const subscriptionStatus: Partial<ISubscription> =
				roomExtraData.federated && options.creator !== member._id && creatorUser
					? {
							status: 'INVITED',
							inviter: {
								_id: creatorUser._id,
								username: creatorUser.username!,
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
						...options?.subscriptionExtra,
						...(options?.creator !== member._id && { open: members.length > 2 }),
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
		// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
		...room!,
		_id: String(rid),
		usernames,
		t: 'd',
		rid,
		inserted: isNewRoom,
	};
}
