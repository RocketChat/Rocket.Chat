RocketChat.Migrations.add({
	version: 70,
	up() {
		const settings = RocketChat.models.Settings.find({ _id: /^Accounts_OAuth_Custom_.+/ }).fetch();
		for (const setting of settings) {
			const _id = setting._id;
			setting._id = setting._id.replace(/Accounts_OAuth_Custom_([A-Za-z0-9]+)_(.+)/, 'Accounts_OAuth_Custom-$1-$2');
			setting._id = setting._id.replace(/Accounts_OAuth_Custom_([A-Za-z0-9]+)/, 'Accounts_OAuth_Custom-$1');

			RocketChat.models.Settings.remove({ _id });
			RocketChat.models.Settings.insert(setting);
		}
	}
});
