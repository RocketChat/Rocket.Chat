import { RocketChat } from 'meteor/rocketchat:lib';

import s from 'underscore.string';

Object.assign(RocketChat.models.Rooms, {
	findThreadParentByNameStarting(name, options) {
		const nameRegex = new RegExp(`^${ s.trim(s.escapeRegExp(name)) }`, 'i');

		const query = {
			t: {
				$in: ['c'],
			},
			name: nameRegex,
			archived: { $ne: true },
			prid: {
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
