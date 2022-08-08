import { AppsEngineException } from '@rocket.chat/apps-engine/definition/exceptions';
import { Meteor } from 'meteor/meteor';
import { Random } from 'meteor/random';
import type { ICreatedRoom, ISubscription, IUser } from '@rocket.chat/core-typings';
import { Subscriptions } from '@rocket.chat/models';
import type { MatchKeysAndValues } from 'mongodb';

import { Users, Rooms } from '../../../models/server';
import { Apps } from '../../../apps/server';
import { callbacks } from '../../../../lib/callbacks';
import { settings } from '../../../settings/server';
import { getDefaultSubscriptionPref } from '../../../utils/server';
import type { ICreateRoomParams } from '../../../../server/sdk/types/IRoomService';

const generateSubscription = (
	fname: string,
	name: string,
	user: IUser,
	extra: MatchKeysAndValues<ISubscription>,
): MatchKeysAndValues<ISubscription> => ({
	_id: Random.id(),
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

export const createDirectRoom = function (
	members: IUser[] | string[],
	roomExtraData = {},
	options: ICreateRoomParams['options'],
): ICreatedRoom {
	if (members.length > (settings.get('DirectMesssage_maxUsers') || 1)) {
		throw new Error('error-direct-message-max-user-exceeded');
	}
	callbacks.run('beforeCreateDirectRoom', members);

	const membersUsernames = members.map((member) => {
		if (typeof member === 'string') {
			return member.replace('@', '');
		}
		return member.username;
	});

	const roomMembers: IUser[] = Users.findUsersByUsernames(membersUsernames, {
		fields: { _id: 1, name: 1, username: 1, settings: 1, customFields: 1 },
	}).fetch();
	// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
	const sortedMembers = roomMembers.sort((u1, u2) => (u1.name! || u1.username!).localeCompare(u2.name! || u2.username!));

	const usernames: string[] = sortedMembers.map(({ username }) => username as string).filter(Boolean);
	const uids = roomMembers.map(({ _id }) => _id).sort();

	// Deprecated: using users' _id to compose the room _id is deprecated
	const room =
		uids.length === 2
			? Rooms.findOneById(uids.join(''), { fields: { _id: 1 } })
			: Rooms.findOneDirectRoomContainingAllUserIDs(uids, { fields: { _id: 1 } });

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

		const prevent = Promise.await(
			Apps.triggerEvent('IPreRoomCreatePrevent', tmpRoom).catch((error) => {
				if (error instanceof AppsEngineException) {
					throw new Meteor.Error('error-app-prevented', error.message);
				}

				throw error;
			}),
		);
		if (prevent) {
			throw new Meteor.Error('error-app-prevented', 'A Rocket.Chat App prevented the room creation.');
		}

		const result = Promise.await(
			Apps.triggerEvent('IPreRoomCreateModify', Promise.await(Apps.triggerEvent('IPreRoomCreateExtend', tmpRoom))),
		);

		if (typeof result === 'object') {
			Object.assign(roomInfo, result);
		}

		delete tmpRoom._USERNAMES;
	}

	const rid = room?._id || Rooms.insert(roomInfo);

	if (roomMembers.length === 1) {
		// dm to yourself
		Subscriptions.updateOne(
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
		const membersWithPreferences: IUser[] = Users.find(
			{ _id: { $in: memberIds } },
			{ projection: { 'username': 1, 'settings.preferences': 1 } },
		);

		membersWithPreferences.forEach((member) => {
			const otherMembers = sortedMembers.filter(({ _id }) => _id !== member._id);
			Subscriptions.updateOne(
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
		});
	}

	// If the room is new, run a callback
	if (isNewRoom) {
		const insertedRoom = Rooms.findOneById(rid);

		callbacks.run('afterCreateDirectRoom', insertedRoom, { members: roomMembers, creatorId: options?.creator });

		Apps.triggerEvent('IPostRoomCreate', insertedRoom);
	}

	return {
		_id: String(rid),
		usernames,
		t: 'd',
		inserted: isNewRoom,
		...room,
	};
};
