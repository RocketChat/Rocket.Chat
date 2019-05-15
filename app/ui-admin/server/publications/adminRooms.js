import { Meteor } from 'meteor/meteor';
import _ from 'underscore';
import s from 'underscore.string';

import { hasPermission } from '../../../authorization';
import { Rooms } from '../../../models';

Meteor.publish('adminRooms', function(filter, types, limit) {
	if (!this.userId) {
		return this.ready();
	}
	if (hasPermission(this.userId, 'view-room-administration') !== true) {
		return this.ready();
	}
	if (!_.isArray(types)) {
		types = [];
	}

	const options = {
		fields: {
			name: 1,
			t: 1,
			cl: 1,
			u: 1,
			usernames: 1,
			usersCount: 1,
			muted: 1,
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

	filter = s.trim(filter);
	if (filter && types.length) {
		// CACHE: can we stop using publications here?
		return Rooms.findByNameContainingAndTypes(filter, types, options);
	} if (types.length) {
		// CACHE: can we stop using publications here?
		return Rooms.findByTypes(types, options);
	}
	// CACHE: can we stop using publications here?
	return Rooms.findByNameContaining(filter, options);
});
