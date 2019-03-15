import { Users, Rooms, Subscriptions } from 'meteor/rocketchat:models';
import { sendMessage } from 'meteor/rocketchat:lib';
/*
 *
 * Get direct chat room helper
 *
 *
 */
const getDirectRoom = (source, target) => {
	const rid = [source._id, target._id].sort().join('');

	Rooms.upsert({ _id: rid }, {
		$setOnInsert: {
			t: 'd',
			msgs: 0,
			ts: new Date(),
		},
	});

	Subscriptions.upsert({ rid, 'u._id': target._id }, {
		$setOnInsert: {
			name: source.username,
			t: 'd',
			open: false,
			alert: false,
			unread: 0,
			u: {
				_id: target._id,
				username: target.username,
			},
		},
	});

	Subscriptions.upsert({ rid, 'u._id': source._id }, {
		$setOnInsert: {
			name: target.username,
			t: 'd',
			open: false,
			alert: false,
			unread: 0,
			u: {
				_id: source._id,
				username: source.username,
			},
		},
	});

	return {
		_id: rid,
		t: 'd',
	};
};

export default function handleSentMessage(args) {
	const user = Users.findOne({
		'profile.irc.nick': args.nick,
	});

	if (!user) {
		throw new Error(`Could not find a user with nick ${ args.nick }`);
	}

	let room;

	if (args.roomName) {
		room = Rooms.findOneByName(args.roomName);
	} else {
		const recipientUser = Users.findOne({
			'profile.irc.nick': args.recipientNick,
		});

		room = getDirectRoom(user, recipientUser);
	}

	const message = {
		msg: args.message,
		ts: new Date(),
	};

	sendMessage(user, message, room);
}
