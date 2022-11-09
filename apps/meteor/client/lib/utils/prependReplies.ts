import type { IMessage, IRoom } from '@rocket.chat/core-typings';
import { Meteor } from 'meteor/meteor';

import { Rooms, Users } from '../../../app/models/client';
import { MessageAction } from '../../../app/ui-utils/client/lib/MessageAction';

export const prependReplies = async (msg: string, replies: IMessage[] = [], mention = false): Promise<string> => {
	const { username } = Users.findOne({ _id: Meteor.userId() }, { fields: { username: 1 } });

	const chunks = await Promise.all(
		replies.map(async ({ _id, rid, u }) => {
			const permalink = await MessageAction.getPermaLink(_id);
			const room: IRoom | null = Rooms.findOne(rid, { fields: { t: 1 } });

			let chunk = `[ ](${permalink})`;
			if (room?.t === 'd' && u.username !== username && mention) {
				chunk += ` @${u.username}`;
			}

			return chunk;
		}),
	);

	chunks.push(msg);
	return chunks.join(' ');
};
