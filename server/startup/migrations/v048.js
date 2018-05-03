RocketChat.Migrations.add({
	version: 48,
	up() {
		if (RocketChat && RocketChat.models && RocketChat.models.Settings) {

			const RocketBot_Enabled = RocketChat.models.Settings.findOne({
				_id: 'RocketBot_Enabled'
			});
			if (RocketBot_Enabled) {
				RocketChat.models.Settings.remove({
					_id: 'RocketBot_Enabled'
				});
				RocketChat.models.Settings.upsert({
					_id: 'InternalHubot_Enabled'
				}, {
					$set: {
						value: RocketBot_Enabled.value
					}
				});
			}

			const RocketBot_Name = RocketChat.models.Settings.findOne({
				_id: 'RocketBot_Name'
			});
			if (RocketBot_Name) {
				RocketChat.models.Settings.remove({
					_id: 'RocketBot_Name'
				});
				RocketChat.models.Settings.upsert({
					_id: 'InternalHubot_Username'
				}, {
					$set: {
						value: RocketBot_Name.value
					}
				});
			}

		}
	}
});
