RocketChat.Migrations.add({
	version: 26,
	up() {
		return RocketChat.models.Messages.update({
			t: 'rm'
		}, {
			$set: {
				mentions: []
			}
		}, {
			multi: true
		});
	}
});
