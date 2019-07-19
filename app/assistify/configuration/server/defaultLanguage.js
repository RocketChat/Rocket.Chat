import { Meteor } from 'meteor/meteor';

import { Settings } from '../../../models';

/**
 * There are cases in which the environment does not feature a locale.
 * Then, the system can't determine the default language, we'll default it to English in this case
 */
Meteor.startup(() => {
	const languageSetting = Settings.db.findOneById('Language');
	if (!languageSetting.value && !languageSetting.packageValue) {
		Settings.db.updateValueById(languageSetting._id, 'en');
	}
});
