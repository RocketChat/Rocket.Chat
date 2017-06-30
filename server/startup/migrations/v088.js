RocketChat.Migrations.add({
	version: 88,
	up() {
		if (RocketChat && RocketChat.models && RocketChat.models.Settings) {
			const setting = RocketChat.models.Settings.findOne({ _id: 'Layout_Sidenav_Footer' });
			if (setting && setting.value && setting.packageValue) {
				if (setting.value === '<img style="left: 10px; position: absolute;" src="/assets/logo.png" />') {
					RocketChat.models.Settings.update({ _id: 'Layout_Sidenav_Footer' }, { $set: { value: setting.packageValue } });
				}
			}
		}
	}
});
