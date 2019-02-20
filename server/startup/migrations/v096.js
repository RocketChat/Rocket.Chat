import { Migrations } from 'meteor/rocketchat:migrations';
import { Settings } from 'meteor/rocketchat:models';

Migrations.add({
	version: 96,
	up() {
		if (Settings) {
			Settings.update({ _id: 'InternalHubot_ScriptsToLoad' }, { $set: { value: '' } });
		}
	},
});
