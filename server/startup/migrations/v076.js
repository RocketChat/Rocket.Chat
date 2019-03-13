import { Migrations } from '/app/migrations';
import { Settings } from '/app/models';

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
