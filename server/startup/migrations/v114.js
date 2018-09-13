RocketChat.Migrations.add({
	version: 114,
	up() {
		if (RocketChat && RocketChat.models) {
			if (RocketChat.models.Settings) {
				const setting = RocketChat.models.Settings.findOne({ _id: 'Message_GlobalSearch' });
				if (setting && setting.value) {
					RocketChat.models.Settings.upsert(
						{ _id: 'Search.defaultProvider.GlobalSearchEnabled' },
						{ $set: { value: setting.value } }
					);

					RocketChat.models.Settings.removeById('Message_GlobalSearch');
				}
			}
		}
	},
});
