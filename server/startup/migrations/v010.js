import { Migrations } from 'meteor/rocketchat:migrations';
import { Rooms } from 'meteor/rocketchat:models';
import _ from 'underscore';

Migrations.add({
	version: 10,
	up() {
		/*
		 * Remove duplicated usernames from rooms
		 */
		let count = 0;

		Rooms.find({
			'usernames.0': {
				$exists: true,
			},
		}, {
			fields: {
				usernames: 1,
			},
		}).forEach((room) => {
			const newUsernames = _.uniq(room.usernames);
			if (newUsernames.length !== room.usernames.length) {
				count++;
				return Rooms.update({
					_id: room._id,
				}, {
					$set: {
						usernames: newUsernames,
					},
				});
			}
		});

		return console.log(`Removed duplicated usernames from ${ count } rooms`);
	},
});
