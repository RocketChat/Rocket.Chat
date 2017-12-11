RocketChat.Migrations.add({
	version: 96,
	up() {
		if (RocketChat && RocketChat.models && RocketChat.models.Settings) {
			RocketChat.models.Settings.update({ _id: 'InternalHubot_ScriptsToLoad' }, { $set: { value: '' } });
		}
	}
});
