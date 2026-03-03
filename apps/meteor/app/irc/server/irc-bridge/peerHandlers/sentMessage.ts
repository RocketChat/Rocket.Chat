import type { IRoom, IUser } from '@rocket.chat/core-typings';
import { Users, Rooms } from '@rocket.chat/models';

import { createDirectRoom } from '../../../../lib/server/functions/createDirectRoom';
import { sendMessage } from '../../../../lib/server/functions/sendMessage';

/*
 *
 * Get direct chat room helper
 *
 *
 */
const getDirectRoom = async (source: IUser, target: IUser): Promise<IRoom> => {
	const uids = [source._id, target._id];
	const { _id, ...extraData } = await createDirectRoom([source, target]);

	const room = await Rooms.findOneDirectRoomContainingAllUserIDs(uids);
	if (room) {
		return {
			t: 'd',
			...(room as Omit<IRoom, 't'>),
		};
	}

	return {
		_id,
		t: 'd',
		...(extraData as Omit<IRoom, '_id' | 't'>),
	} as IRoom;
};

type SentMessageArgs = {
	nick: string;
	roomName?: string;
	recipientNick?: string;
	message: string;
};

export default async function handleSentMessage(args: SentMessageArgs): Promise<void> {
	const user = await Users.findOne({
		'profile.irc.nick': args.nick,
	});

	if (!user) {
		throw new Error(`Could not find a user with nick ${args.nick}`);
	}

	let room: IRoom | null;

	if (args.roomName) {
		room = await Rooms.findOneByName(args.roomName);
	} else {
		const recipientUser = await Users.findOne({
			'profile.irc.nick': args.recipientNick,
		});

		if (!recipientUser) {
			throw new Error(`Could not find recipient user with nick ${args.recipientNick}`);
		}

		room = await getDirectRoom(user, recipientUser);
	}

	if (!room) {
		throw new Error(`Could not find or create room`);
	}

	const message = {
		msg: args.message,
		ts: new Date(),
	};

	await sendMessage(user, message, room);
}
