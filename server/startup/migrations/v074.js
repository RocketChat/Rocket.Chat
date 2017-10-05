RocketChat.Migrations.add({
	version: 74,
	up() {
		if (RocketChat && RocketChat.models && RocketChat.models.Settings) {
			RocketChat.models.Settings.remove({_id: 'Assets_favicon_64'});
			RocketChat.models.Settings.remove({_id: 'Assets_favicon_96'});
			RocketChat.models.Settings.remove({_id: 'Assets_favicon_128'});
			RocketChat.models.Settings.remove({_id: 'Assets_favicon_256'});
			RocketChat.models.Settings.update({_id: 'Assets_favicon_192'}, {
				$set: {
					i18nLabel: 'android-chrome 192x192 (png)'
				}
			});
		}
	}
});
