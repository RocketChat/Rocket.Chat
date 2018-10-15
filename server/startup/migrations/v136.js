RocketChat.Migrations.add({
	version: 136,
	up() {
		RocketChat.models.Rooms.update({
			ro: true,
			muted: {
				$exists: true,
				$not: {
					$size: 0,
				},
			},
		}, {
			$set: {
				muted: [],
			},
		}, {
			multi: true,
		});
	},
});
