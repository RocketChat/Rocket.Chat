import { Rooms, Subscriptions } from '../../../models/server';
import { settings } from '../../../settings/server';
import { getDefaultSubscriptionPref } from '../../../utils/server';
import { callbacks } from '../../../callbacks/server';

const generateSubscription = (fname, name, user, extra) => ({
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
});

const getFname = (members) => members.map(({ name, username }) => name || username).join(', ');
const getName = (members) => members.map(({ username }) => username).join(', ');

export const createDirectRoom = function(members, roomExtraData = {}, options = {}) {
	if (members.length > (settings.get('DirectMesssage_maxUsers') || 1)) {
		throw new Error('error-direct-message-max-user-exceeded');
	}

	const sortedMembers = members.sort((u1, u2) => (u1.name || u1.username).localeCompare(u2.name || u2.username));

	const usernames = sortedMembers.map(({ username }) => username);
	const uids = members.map(({ _id }) => _id).sort();

	// Deprecated: using users' _id to compose the room _id is deprecated
	const room = uids.length === 2
		? Rooms.findOneById(uids.join(''), { fields: { _id: 1 } })
		: Rooms.findOneDirectRoomContainingAllUserIDs(uids, { fields: { _id: 1 } });

	const isNewRoom = !room;

	const rid = room?._id || Rooms.insert({
		...uids.length === 2 && { _id: uids.join('') }, // Deprecated: using users' _id to compose the room _id is deprecated
		t: 'd',
		usernames,
		usersCount: members.length,
		msgs: 0,
		ts: new Date(),
		uids,
		...roomExtraData,
	});

	if (members.length === 1) { // dm to yourself
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
	}

	return {
		_id: rid,
		usernames,
		t: 'd',
		inserted: isNewRoom,
	};
};
