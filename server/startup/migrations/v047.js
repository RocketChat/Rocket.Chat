import { Migrations } from '/app/migrations';
import { Settings } from '/app/models';

Migrations.add({
	version: 47,
	up() {
		if (Settings) {
			const autolinkerUrls = Settings.findOne({ _id: 'AutoLinker_Urls' });
			if (autolinkerUrls) {
				Settings.remove({ _id: 'AutoLinker_Urls' });
				Settings.upsert({ _id: 'AutoLinker_Urls_Scheme' }, {
					$set: {
						value: !!autolinkerUrls.value,
						i18nLabel: 'AutoLinker_Urls_Scheme',
					},
				});
				Settings.upsert({ _id: 'AutoLinker_Urls_www' }, {
					$set: {
						value: !!autolinkerUrls.value,
						i18nLabel: 'AutoLinker_Urls_www',
					},
				});
				Settings.upsert({ _id: 'AutoLinker_Urls_TLD' }, {
					$set: {
						value: !!autolinkerUrls.value,
						i18nLabel: 'AutoLinker_Urls_TLD',
					},
				});
			}
		}
	},
});
