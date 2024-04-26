import { AppEvents, Apps } from '@rocket.chat/apps';
import { AppsEngineException } from '@rocket.chat/apps-engine/definition/exceptions';
import type { ISubscriptionExtraData } from '@rocket.chat/core-services';
import type { ICreatedRoom, IRoom, ISubscription, IUser } from '@rocket.chat/core-typings';
import { Rooms, Subscriptions, Users } from '@rocket.chat/models';
import { Random } from '@rocket.chat/random';
import { Meteor } from 'meteor/meteor';
import type { MatchKeysAndValues } from 'mongodb';

import { callbacks } from '../../../../lib/callbacks';
import { isTruthy } from '../../../../lib/isTruthy';
import { settings } from '../../../settings/server';
import { getDefaultSubscriptionPref } from '../../../utils/lib/getDefaultSubscriptionPref';

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

const getFname = (members: IUser[]): string => members.map(({ name, username }) => name || username).join(', ');
const getName = (members: IUser[]): string => members.map(({ username }) => username).join(', ');

export async function createDirectRoom(
	members: IUser[] | string[],
	roomExtraData = {},
	options: {
		creator?: string;
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

	await callbacks.run('beforeCreateDirectRoom', members);

	const membersUsernames: string[] = members
		.map((member) => {
			if (typeof member === 'string') {
				return member.replace('@', '');
			}
			return member.username;
		})
		.filter(isTruthy);

	const roomMembers: IUser[] = await Users.findUsersByUsernames(membersUsernames, {
		projection: { _id: 1, name: 1, username: 1, settings: 1, customFields: 1 },
	}).toArray();
	// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
	const sortedMembers = roomMembers.sort((u1, u2) => (u1.name! || u1.username!).localeCompare(u2.name! || u2.username!));

	const usernames: string[] = sortedMembers.map(({ username }) => username as string).filter(Boolean);
	const uids = roomMembers.map(({ _id }) => _id).sort();

	// Deprecated: using users' _id to compose the room _id is deprecated
	const room: IRoom | null =
		uids.length === 2
			? await Rooms.findOneById(uids.join(''), { projection: { _id: 1 } })
			: await Rooms.findOneDirectRoomContainingAllUserIDs(uids, { projection: { _id: 1 } });

	const isNewRoom = !room;

	const roomInfo = {
		...(uids.length === 2 && { _id: uids.join('') }), // Deprecated: using users' _id to compose the room _id is deprecated
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

	if (roomMembers.length === 1) {
		// dm to yourself
		await Subscriptions.updateOne(
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
	} else {
		const memberIds = roomMembers.map((member) => member._id);
		const membersWithPreferences: IUser[] = await Users.find(
			{ _id: { $in: memberIds } },
			{ projection: { 'username': 1, 'settings.preferences': 1 } },
		).toArray();

		for await (const member of membersWithPreferences) {
			const otherMembers = sortedMembers.filter(({ _id }) => _id !== member._id);
			await Subscriptions.updateOne(
				{ rid, 'u._id': member._id },
				{
					...(options?.creator === member._id && { $set: { open: true } }),
					$setOnInsert: generateSubscription(getFname(otherMembers), getName(otherMembers), member, {
						...options?.subscriptionExtra,
						...(options?.creator !== member._id && { open: members.length > 2 }),
					}),
				},
				{ upsert: true },
			);
		}
	}

	// If the room is new, run a callback
	if (isNewRoom) {
		const insertedRoom = await Rooms.findOneById(rid);

		await callbacks.run('afterCreateDirectRoom', insertedRoom, { members: roomMembers, creatorId: options?.creator });

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
