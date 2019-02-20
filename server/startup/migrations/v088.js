import { Migrations } from 'meteor/rocketchat:migrations';
import { Settings } from 'meteor/rocketchat:models';

Migrations.add({
	version: 88,
	up() {
		if (Settings) {
			const setting = Settings.findOne({ _id: 'Layout_Sidenav_Footer' });
			if (setting && setting.value && setting.packageValue) {
				if (setting.value === '<img style="left: 10px; position: absolute;" src="/assets/logo.png" />') {
					Settings.update({ _id: 'Layout_Sidenav_Footer' }, { $set: { value: setting.packageValue } });
				}
			}
		}
	},
});
