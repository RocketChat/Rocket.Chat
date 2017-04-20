RocketChat.Migrations.add({
	version: 68,
	up() {
		const GoogleSiteVerification_id = RocketChat.models.Settings.findOne({ _id: 'GoogleSiteVerification_id' });

		if (GoogleSiteVerification_id && GoogleSiteVerification_id.value) {
			RocketChat.models.Settings.update({ _id: 'Meta_google-site-verification' }, {
				$set: {
					value: GoogleSiteVerification_id.value
				}
			});
		}

		RocketChat.models.Settings.remove({ _id: 'GoogleSiteVerification_id' });
	}
});

