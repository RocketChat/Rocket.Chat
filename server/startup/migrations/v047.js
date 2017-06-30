RocketChat.Migrations.add({
	version: 47,
	up() {
		if (RocketChat && RocketChat.models && RocketChat.models.Settings) {
			const autolinkerUrls = RocketChat.models.Settings.findOne({ _id: 'AutoLinker_Urls' });
			if (autolinkerUrls) {
				RocketChat.models.Settings.remove({ _id: 'AutoLinker_Urls' });
				RocketChat.models.Settings.upsert({ _id: 'AutoLinker_Urls_Scheme' }, {
					$set: {
						value: autolinkerUrls.value ? true : false,
						i18nLabel: 'AutoLinker_Urls_Scheme'
					}
				});
				RocketChat.models.Settings.upsert({ _id: 'AutoLinker_Urls_www' }, {
					$set: {
						value: autolinkerUrls.value ? true : false,
						i18nLabel: 'AutoLinker_Urls_www'
					}
				});
				RocketChat.models.Settings.upsert({ _id: 'AutoLinker_Urls_TLD' }, {
					$set: {
						value: autolinkerUrls.value ? true : false,
						i18nLabel: 'AutoLinker_Urls_TLD'
					}
				});
			}
		}
	}
});
