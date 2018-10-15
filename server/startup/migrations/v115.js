RocketChat.Migrations.add({
	version: 115,
	up() {
		RocketChat.models.Rooms.update({
			'announcement.message': { $exists: true },
		}, {
			$unset: { announcement: 1 },
		}, { multi: true });
	},
});
