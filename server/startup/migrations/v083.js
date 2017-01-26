RocketChat.Migrations.add({
	version: 83,
	up: function() {
		if (RocketChat && RocketChat.models && RocketChat.models.Settings && RocketChat.models.Users) {
			var setting = RocketChat.models.Settings.findOne({ _id: 'InternalHubot_Username' });
			if (setting && setting.value) {
				var username = setting.value;
				var user = RocketChat.models.Users.findOne({ username: username });
				if (!user && setting.value === 'Rocket.Cat') {
					RocketChat.models.Settings.update({ _id: 'InternalHubot_Username' }, { $set: { value: 'rocket.cat', packageValue: 'rocket.cat' } });
				}
			}
		}
	}
});
