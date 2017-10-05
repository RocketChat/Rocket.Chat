RocketChat.Migrations.add({
	version: 21,
	up() {
		/*
		 * Remove any i18nLabel from rocketchat_settings
		 * They will be added again where necessary on next restart
		 */
		RocketChat.models.Settings.update({
			i18nLabel: {
				$exists: true
			}
		}, {
			$unset: {
				i18nLabel: 1
			}
		}, {
			multi: true
		});

		return console.log('Removed i18nLabel from Settings. New labels will be added on next restart! Please restart your server.');
	}
});
