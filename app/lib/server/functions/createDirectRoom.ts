import { AppsEngineException } from '@rocket.chat/apps-engine/definition/exceptions';

import { Apps } from '../../../apps/server';
import { callbacks } from '../../../callbacks/server';
import { Rooms, Subscriptions } from '../../../models/server';
import { settings } from '../../../settings/server';
import { getDefaultSubscriptionPref } from '../../../utils/server';
import { ICreateDirectRoomResult } from './types';
import { IUser } from '../../../../definition/IUser';
import { ISubscription, ISubscriptionExtraData } from '../../../../definition/ISubscription';
import { ICreateRoomOptions, ICreateRoomExtraData } from '../../../../server/sdk/types/IRoomService';

function generateSubscription(fname: string, name: string, user: IUser, extra: ISubscriptionExtraData): Partial<ISubscription> {
	return {
		alert: false,
		unread: 0,
		userMentions: 0,
		groupMentions: 0,
		...user.customFields && { customFields: user.customFields },
		...getDefaultSubscriptionPref(user),
		...extra,
		t: 'd',
		fname,
		name,
		u: {
			_id: user._id,
			username: user.username,
		},
	};
}

function getFname(members: IUser[]): string {
	return members.map(({ name, username }) => name || username).join(', ');
}

function getName(members: IUser[]): string {
	return members.map(({ username }) => username).join(', ');
}

export const createDirectRoom = async (members: IUser[], roomExtraData: ICreateRoomExtraData, options: ICreateRoomOptions): Promise<ICreateDirectRoomResult> => {
	if (members.length > (settings.get('DirectMesssage_maxUsers') || 1)) {
		throw new Error('error-direct-message-max-user-exceeded');
	}

	const sortedMembers = members.sort((u1, u2) => {
		const name1 = u1.name || u1.username;
		const name2 = u2.name || u2.username;

		if (!name1 || !name2) {
			throw new Error('Invalid users list, could not create direct room');
		}

		return name1.localeCompare(name2);
	});

	const usernames = sortedMembers.map((m) => m.username).filter((u): u is string => !!u);

	const uids = members.map(({ _id }) => _id).sort();

	// Deprecated: using users' _id to compose the room _id is deprecated
	const room = uids.length === 2
		? Rooms.findOneById(uids.join(''), { fields: { _id: 1 } })
		: Rooms.findOneDirectRoomContainingAllUserIDs(uids, { fields: { _id: 1 } });

	const isNewRoom = !room;

	const roomInfo = {
		...uids.length === 2 && { _id: uids.join('') }, // Deprecated: using users' _id to compose the room _id is deprecated
		t: 'd',
		usernames,
		usersCount: members.length,
		msgs: 0,
		ts: new Date(),
		uids,
		...roomExtraData,
	};

	if (isNewRoom) {
		const roomInfoWithUsernames = Object.assign(roomInfo, { _USERNAMES: usernames });

		const prevent = await Apps.triggerEvent('IPreRoomCreatePrevent', roomInfoWithUsernames).catch((error) => {
			if (error instanceof AppsEngineException) {
				throw error;
			}

			throw error;
		});
		if (prevent) {
			throw new Error('error-app-prevented. A Rocket.Chat App prevented the room creation.');
		}

		let result;
		result = await Apps.triggerEvent('IPreRoomCreateExtend', roomInfoWithUsernames);
		result = await Apps.triggerEvent('IPreRoomCreateModify', result);

		if (typeof result === 'object') {
			Object.assign(roomInfo, result);
		}
	}

	const rid = room?._id || Rooms.insert(roomInfo);

	if (members.length === 1) { // dm to yourself
		if (!members[0].username) {
			throw new Error('error trying to send a dm to yourself');
		}

		Subscriptions.upsert({ rid, 'u._id': members[0]._id }, {
			$set: { open: true },
			$setOnInsert: generateSubscription(members[0].name || members[0].username, members[0].username, members[0], { ...options.subscriptionExtra }),
		});
	} else {
		members.forEach((member) => {
			const otherMembers = sortedMembers.filter(({ _id }) => _id !== member._id);

			Subscriptions.upsert({ rid, 'u._id': member._id }, {
				...options.creator === member._id && { $set: { open: true } },
				$setOnInsert: generateSubscription(
					getFname(otherMembers),
					getName(otherMembers),
					member,
					{
						...options.subscriptionExtra,
						...options.creator !== member._id && { open: members.length > 2 },
					},
				),
			});
		});
	}

	// If the room is new, run a callback
	if (isNewRoom) {
		const insertedRoom = Rooms.findOneById(rid);

		callbacks.run('afterCreateDirectRoom', insertedRoom, { members });

		Apps.triggerEvent('IPostRoomCreate', insertedRoom);
	}

	return {
		_id: rid,
		usernames,
		t: 'd',
		inserted: isNewRoom,
	};
};
