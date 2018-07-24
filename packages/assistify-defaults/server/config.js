/* globals RocketChat */

Meteor.startup(() => {
	const languageSetting = RocketChat.models.Settings.db.findOneById('Language');
	if (!languageSetting.value && languageSetting.value === languageSetting.packageValue) {
		RocketChat.models.Settings.db.updateValueById(languageSetting._id, 'en');
	}
});
