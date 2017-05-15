RocketChat.Migrations.add({
	version: 85,
	up() {
		const query = {
			t: 'p',
			usernames: {$size: 2},
			u: {$exists: false},
			name: {$exists: false}
		};

		const rooms = RocketChat.models.Rooms.find(query).fetch();

		if (rooms.length > 0) {
			const rids = rooms.map(room => room._id);
			RocketChat.models.Rooms.update({_id: {$in: rids}}, {$set: {t: 'd'}}, {multi: true});
			RocketChat.models.Subscriptions.update({rid: {$in: rids}}, {$set: {t: 'd'}}, {multi: true});
		}
	}
});
