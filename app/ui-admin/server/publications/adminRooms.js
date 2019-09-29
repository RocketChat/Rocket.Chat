import { Meteor } from 'meteor/meteor';
import s from 'underscore.string';

import { hasPermission } from '../../../authorization';
import { Rooms } from '../../../models/server';

Meteor.publish('adminRooms', function(filter, types = [], limit) {
	const showTypes = Array.isArray(types) ? types.filter((type) => type !== 'dicussions') : [];
	const discussion = types.includes('dicussions');

	if (!this.userId) {
		return this.ready();
	}

	if (hasPermission(this.userId, 'view-room-administration') !== true) {
		return this.ready();
	}

	const options = {
		fields: {
			prid: 1,
			fname: 1,
			name: 1,
			t: 1,
			cl: 1,
			u: 1,
			usernames: 1,
			usersCount: 1,
			muted: 1,
			unmuted: 1,
			ro: 1,
			default: 1,
			topic: 1,
			msgs: 1,
			archived: 1,
			tokenpass: 1,
		},
		limit,
		sort: {
			default: -1,
			name: 1,
		},
	};

	const name = s.trim(filter);

	if (name && showTypes.length) {
		// CACHE: can we stop using publications here?
		return Rooms.findByNameContainingAndTypes(name, showTypes, discussion, options);
	}

	if (showTypes.length) {
		// CACHE: can we stop using publications here?
		return Rooms.findByTypes(showTypes, discussion, options);
	}
	// CACHE: can we stop using publications here?
	return Rooms.findByNameContaining(filter, discussion, options);
});
