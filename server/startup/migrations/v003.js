import { Migrations } from 'meteor/rocketchat:migrations';
import { Users, Subscriptions, Rooms, Messages } from 'meteor/rocketchat:models';

Migrations.add({
	version: 3,
	up() {
		Subscriptions.tryDropIndex('uid_1');
		Subscriptions.tryDropIndex('rid_1_uid_1');

		console.log('Fixing ChatSubscription uid');

		Subscriptions.find({
			uid: {
				$exists: true,
			},
		}, {
			nonreactive: true,
		}).forEach((sub) => {
			const update = {};
			const user = Users.findOneById(sub.uid, {
				fields: {
					username: 1,
				},
			});

			if (user) {
				if (!update.$set) {
					update.$set = {};
				}

				if (!update.$unset) {
					update.$unset = {};
				}

				update.$set['u._id'] = user._id;
				update.$set['u.username'] = user.username;
				update.$unset.uid = 1;
			}

			if (Object.keys(update).length > 0) {
				return Subscriptions.update(sub._id, update);
			}
		});

		console.log('Fixing ChatRoom uids');

		Rooms.find({
			'uids.0': {
				$exists: true,
			},
		}, {
			nonreactive: true,
		}).forEach(function(room) {
			const update = {};
			const users = Users.find({
				_id: {
					$in: room.uids,
				},
				username: {
					$exists: true,
				},
			}, {
				fields: {
					username: 1,
				},
			});

			const usernames = users.map(function(user) {
				return user.username;
			});

			if (!update.$set) {
				update.$set = {};
			}

			if (!update.$unset) {
				update.$unset = {};
			}

			update.$set.usernames = usernames;
			update.$unset.uids = 1;

			const user = Users.findOneById(room.uid, {
				fields: {
					username: 1,
				},
			});

			if (user) {
				update.$set['u._id'] = user._id;
				update.$set['u.username'] = user.username;
				update.$unset.uid = 1;
			}

			if (room.t === 'd' && usernames.length === 2) {
				for (const k of Object.keys(update.$set)) {
					const v = update.$set[k];
					room[k] = v;
				}

				for (const k of Object.keys(update.$unset)) {
					delete room[k];
				}

				const oldId = room._id;

				room._id = usernames.sort().join(',');

				Rooms.insert(room);
				Rooms.removeById(oldId);

				Subscriptions.update({
					rid: oldId,
				}, {
					$set: {
						rid: room._id,
					},
				}, {
					multi: true,
				});

				return Messages.update({
					rid: oldId,
				}, {
					$set: {
						rid: room._id,
					},
				}, {
					multi: true,
				});
			} else {
				return Rooms.update(room._id, update);
			}
		});

		console.log('Fixing ChatMessage uid');

		Messages.find({
			uid: {
				$exists: true,
			},
		}, {
			nonreactive: true,
		}).forEach((message) => {
			const update = {};
			const user = Users.findOneById(message.uid, {
				fields: {
					username: 1,
				},
			});

			if (user) {
				if (!update.$set) {
					update.$set = {};
				}

				if (!update.$unset) {
					update.$unset = {};
				}

				update.$set['u._id'] = user._id;
				update.$set['u.username'] = user.username;
				update.$unset.uid = 1;
			}

			if (Object.keys(update).length > 0) {
				return Messages.update(message._id, update);
			}
		});

		return console.log('End');
	},
});
