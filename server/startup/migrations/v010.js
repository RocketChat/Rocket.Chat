RocketChat.Migrations.add({
	version: 10,
	up() {
		/*
		 * Remove duplicated usernames from rooms
		 */
		let count = 0;

		RocketChat.models.Rooms.find({
			'usernames.0': {
				$exists: true
			}
		}, {
			fields: {
				usernames: 1
			}
		}).forEach((room) => {
			const newUsernames = _.uniq(room.usernames);
			if (newUsernames.length !== room.usernames.length) {
				count++;
				return RocketChat.models.Rooms.update({
					_id: room._id
				}, {
					$set: {
						usernames: newUsernames
					}
				});
			}
		});

		return console.log(`Removed duplicated usernames from ${ count } rooms`);
	}
});
