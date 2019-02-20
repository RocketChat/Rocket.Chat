import { Rooms } from 'meteor/rocketchat:models';

import s from 'underscore.string';

Object.assign(Rooms, {
	findThreadParentByNameStarting(name, options) {
		const nameRegex = new RegExp(`^${ s.trim(s.escapeRegExp(name)) }`, 'i');

		const query = {
			t: {
				$in: ['c'],
			},
			name: nameRegex,
			archived: { $ne: true },
			parentRoomId: {
				$exists: false,
			},
		};

		return this.find(query, options);
	},

	setLinkMessageById(_id, linkMessageId) {
		const query = { _id };

		const update = {
			$set: {
				linkMessageId,
			},
		};

		return this.update(query, update);
	},
});
