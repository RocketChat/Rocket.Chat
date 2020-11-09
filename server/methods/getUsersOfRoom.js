import { Meteor } from 'meteor/meteor';

import { Subscriptions, Users } from '../../app/models/server';
import { hasPermission } from '../../app/authorization';
import { settings } from '../../app/settings';

function findUsers({ rid, status, skip, limit, filter = '' }) {
	const options = {
		fields: {
			name: 1,
			username: 1,
			nickname: 1,
			status: 1,
			avatarETag: 1,
		},
		sort: {
			statusConnection: -1,
			[settings.get('UI_Use_Real_Name') ? 'name' : 'username']: 1,
		},
		...skip > 0 && { skip },
		...limit > 0 && { limit },
	};

	return Users.findByActiveUsersExcept(filter, undefined, options, undefined, [{
		__rooms: rid,
		...status && { status },
	}]).fetch();
}

Meteor.methods({
	async getUsersOfRoom(rid, showAll, { limit, skip } = {}, filter) {
		const userId = Meteor.userId();
		if (!userId) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user', { method: 'getUsersOfRoom' });
		}

		const room = Meteor.call('canAccessRoom', rid, userId);
		if (!room) {
			throw new Meteor.Error('error-invalid-room', 'Invalid room', { method: 'getUsersOfRoom' });
		}

		if (room.broadcast && !hasPermission(userId, 'view-broadcast-member-list', rid)) {
			throw new Meteor.Error('error-not-allowed', 'Not allowed', { method: 'getUsersOfRoom' });
		}

		const total = Subscriptions.findByRoomIdWhenUsernameExists(rid).count();

		const users = await findUsers({ rid, status: !showAll ? { $ne: 'offline' } : undefined, limit, skip, filter });

		return {
			total,
			records: users,
		};
	},
});
