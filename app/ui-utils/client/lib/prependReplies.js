import { Meteor } from 'meteor/meteor';

import { MessageAction } from './MessageAction';
import { Rooms, Users } from '../../../models/client';

const getStartEnd = (start, end) => {
	let parameters = '';
	if (start !== undefined) {
		parameters += `&start=${ start }`;
	}
	if (end !== undefined) {
		parameters += `&end=${ end }`;
	}
	return parameters;
};

export const prependReplies = async (msg, replies = [], mention = false) => {
	const { username } = Users.findOne({ _id: Meteor.userId() }, { fields: { username: 1 } });

	const chunks = await Promise.all(replies.map(async ({ _id, rid, u, start, end }) => {
		const permalink = await MessageAction.getPermaLink(_id);
		const room = Rooms.findOne(rid, { fields: { t: 1 } });

		const query_params = getStartEnd(start, end);

		let chunk = `[ ](${ permalink }${ query_params })`;
		if (room.t === 'd' && u.username !== username && mention) {
			chunk += ` @${ u.username }`;
		}

		return chunk;
	}));

	chunks.push(msg);
	return chunks.join(' ');
};
