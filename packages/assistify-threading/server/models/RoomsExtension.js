import { RocketChat } from 'meteor/rocketchat:lib';

import s from 'underscore.string';

Object.assign(RocketChat.models.Rooms, {
	findThreadParentByNameStarting(name, options) {
		const nameRegex = new RegExp(`^${ s.trim(s.escapeRegExp(name)) }`, 'i');

		const query = {
			t: {
				$in: ['c']
			},
			name: nameRegex,
			parentRoomId: {
				$exists: false
			}
		};

		return this.find(query, options);
	}
});
