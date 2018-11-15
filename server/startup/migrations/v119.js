RocketChat.Migrations.add({
	version: 119,
	up() {
		if (RocketChat.models && RocketChat.models.Settings) {
			RocketChat.models.Settings.update({
				_id: 'Show_Setup_Wizard',
				value: true,
			}, {
				$set: { value: 'pending' },
			});

			RocketChat.models.Settings.update({
				_id: 'Show_Setup_Wizard',
				value: false,
			}, {
				$set: { value: 'completed' },
			});
		}
	},
});
