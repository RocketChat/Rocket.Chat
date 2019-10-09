import { BaseRaw } from './BaseRaw';

export class MessagesRaw extends BaseRaw {
	findVisibleByMentionAndRoomId(username, rid, options) {
		const query = {
			_hidden: { $ne: true },
			'mentions.username': username,
			rid,
		};

		return this.find(query, options);
	}
}
