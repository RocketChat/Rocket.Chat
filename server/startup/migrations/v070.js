import { Migrations } from 'meteor/rocketchat:migrations';
import { Settings } from 'meteor/rocketchat:models';

Migrations.add({
	version: 70,
	up() {
		const settings = Settings.find({ _id: /^Accounts_OAuth_Custom_.+/ }).fetch();
		for (const setting of settings) {
			const { _id } = setting;
			setting._id = setting._id.replace(/Accounts_OAuth_Custom_([A-Za-z0-9]+)_(.+)/, 'Accounts_OAuth_Custom-$1-$2');
			setting._id = setting._id.replace(/Accounts_OAuth_Custom_([A-Za-z0-9]+)/, 'Accounts_OAuth_Custom-$1');

			Settings.remove({ _id });
			Settings.insert(setting);
		}
	},
});
