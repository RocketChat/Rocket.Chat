import { Meteor } from 'meteor/meteor';
import { TAPi18n } from 'meteor/rocketchat:tap-i18n';
import { Session } from 'meteor/session';
import { Tracker } from 'meteor/tracker';

import { applyCustomTranslations } from '../lib/utils/applyCustomTranslations';

Meteor.startup(() => {
	Tracker.autorun(() => {
		// Re apply translations if tap language was changed
		Session.get(TAPi18n._loaded_lang_session_key);
		applyCustomTranslations();
	});
});
