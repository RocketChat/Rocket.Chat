RocketChat.Migrations.add({
	version: 90,
	up() {
		RocketChat.models.Settings.remove({ _id: 'Piwik', type: 'group' });

		const settings = RocketChat.models.Settings.find({$or: [{_id: 'PiwikAnalytics_url', value: {$ne: null}}, {_id: 'PiwikAnalytics_siteId', value: {$ne: null}}]}).fetch();

		if (settings && settings.length === 2) {
			RocketChat.models.Settings.upsert({_id: 'PiwikAnalytics_enabled'}, {$set: {value: true}});
		}
	}
});
