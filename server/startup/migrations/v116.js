RocketChat.Migrations.add({
	version: 116,
	up() {
		if (RocketChat && RocketChat.models) {
			if (RocketChat.models.Settings) {
				const setting = RocketChat.models.Settings.findOne({ _id: 'Show_Setup_Wizard' });
				if (!setting) {
					RocketChat.models.Settings.upsert(
						{ _id: 'Show_Setup_Wizard' },
						{ $set: { value: false }}
					);
				}
			}
		}
	}
});
