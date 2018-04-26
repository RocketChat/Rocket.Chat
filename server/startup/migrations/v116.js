RocketChat.Migrations.add({
	version: 116,
	up() {
		RocketChat.models.Settings.updateValueById('Store_Last_Message', true);
	}
});
