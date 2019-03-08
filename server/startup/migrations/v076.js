import { Migrations } from 'meteor/rocketchat:migrations';
import { Settings } from 'meteor/rocketchat:models';

Migrations.add({
	version: 76,
	up() {
		if (Settings) {
			Settings.find({ section: 'Colors (alphas)' }).forEach((setting) => {
				Settings.remove({ _id: setting._id });
			});
		}
	},
});
