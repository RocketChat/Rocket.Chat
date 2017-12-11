RocketChat.Migrations.add({
	version: 66,
	up() {
		if (RocketChat && RocketChat.models && RocketChat.models.Settings) {

			// New color settings - start with old settings as defaults
			const replace1 = RocketChat.models.Settings.findOne({ _id: 'theme-color-tertiary-background-color' });
			if (replace1) {
				RocketChat.models.Settings.upsert({ _id: 'theme-color-component-color' }, { $set: { value: replace1.value } });
			}
		}
	}
});
