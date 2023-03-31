import { Meteor } from 'meteor/meteor';
import { Accounts } from 'meteor/accounts-base';
import { Tracker } from 'meteor/tracker';

Tracker.autorun(function () {
	if (Meteor.userId()) {
		const secure = location.protocol === 'https:' ? '; secure' : '';

		document.cookie = `rc_uid=${escape(Meteor.userId())}; path=/${secure}`;
		document.cookie = `rc_token=${escape(Accounts._storedLoginToken())}; path=/${secure}`;
	}
});
