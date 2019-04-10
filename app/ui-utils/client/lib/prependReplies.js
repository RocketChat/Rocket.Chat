import { Meteor } from 'meteor/meteor';
import { MessageAction } from './MessageAction';
import { Rooms, Users } from '../../../models/client';

export const prependReplies = async(msg, replies = [], mention = false) => {
	const { username } = Users.findOne({ _id: Meteor.userId() }, { fields: { username: 1 } });

	const chunks = await Promise.all(replies.map(async({ _id, rid, u }) => {
		const permalink = await MessageAction.getPermaLink(_id);
		const room = Rooms.findOne(rid, { fields: { t: 1 } });

		let chunk = `[ ](${ permalink })`;
		if (room.t === 'd' && u.username !== username && mention) {
			chunk += ` @${ u.username }`;
		}

		return chunk;
	}));

	chunks.push(msg);
	return chunks.join(' ');
};
