RocketChat.Migrations.add({
	version: 83,
	up() {
		if (RocketChat && RocketChat.models && RocketChat.models.Settings && RocketChat.models.Users) {
			const setting = RocketChat.models.Settings.findOne({ _id: 'InternalHubot_Username' });
			if (setting && setting.value) {
				const username = setting.value;
				const user = RocketChat.models.Users.findOne({ username });
				if (!user && setting.value === 'Rocket.Cat') {
					RocketChat.models.Settings.update({ _id: 'InternalHubot_Username' }, { $set: { value: 'rocket.cat', packageValue: 'rocket.cat' } });
				}
			}
		}
	}
});
