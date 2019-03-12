import { Meteor } from 'meteor/meteor';
import { Session } from 'meteor/session';
import { TAPi18n } from 'meteor/tap:i18n';
import { applyCustomTranslations } from '/app/utils';
import { Tracker } from 'meteor/tracker';

Meteor.startup(function() {
	Tracker.autorun(function() {
		// Re apply translations if tap language was changed
		Session.get(TAPi18n._loaded_lang_session_key);
		applyCustomTranslations();
	});
});
