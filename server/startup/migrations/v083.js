import { Migrations } from 'meteor/rocketchat:migrations';
import { Settings, Users } from 'meteor/rocketchat:models';

Migrations.add({
	version: 83,
	up() {
		if (Settings && Users) {
			const setting = Settings.findOne({ _id: 'InternalHubot_Username' });
			if (setting && setting.value) {
				const username = setting.value;
				const user = Users.findOne({ username });
				if (!user && setting.value === 'Rocket.Cat') {
					Settings.update({ _id: 'InternalHubot_Username' }, { $set: { value: 'rocket.cat', packageValue: 'rocket.cat' } });
				}
			}
		}
	},
});
