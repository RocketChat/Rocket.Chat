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

	findStarredByUserAtRoom(userId, roomId, options) {
		const query = {
			_hidden: { $ne: true },
			'starred._id': userId,
			rid: roomId,
		};

		return this.find(query, options);
	}

	findByRoomIdAndType(roomId, type, options) {
		const query = {
			rid: roomId,
			t: type,
		};

		if (options == null) { options = {}; }

		return this.find(query, options);
	}

	findSnippetedByRoom(roomId, options) {
		const query = {
			_hidden: { $ne: true },
			snippeted: true,
			rid: roomId,
		};

		return this.find(query, options);
	}

	findDiscussionsByRoom(rid, options) {
		const query = { rid, drid: { $exists: true } };

		return this.find(query, options);
	}
}
