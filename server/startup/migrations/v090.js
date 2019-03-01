import { Migrations } from 'meteor/rocketchat:migrations';
import { Settings } from 'meteor/rocketchat:models';

Migrations.add({
	version: 90,
	up() {
		Settings.remove({ _id: 'Piwik', type: 'group' });

		const settings = Settings.find({ $or: [{ _id: 'PiwikAnalytics_url', value: { $ne: null } }, { _id: 'PiwikAnalytics_siteId', value: { $ne: null } }] }).fetch();

		if (settings && settings.length === 2) {
			Settings.upsert({ _id: 'PiwikAnalytics_enabled' }, { $set: { value: true } });
		}
	},
});
