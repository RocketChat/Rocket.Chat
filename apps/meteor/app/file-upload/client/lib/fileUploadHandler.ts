import { Accounts } from 'meteor/accounts-base';
import { Meteor } from 'meteor/meteor';
import { Tracker } from 'meteor/tracker';

Tracker.autorun(() => {
	const userId = Meteor.userId();

	// Check for Meteor.loggingIn to be reactive and ensure it will process only after login finishes
	// preventing race condition setting the rc_token as null forever
	if (userId && Meteor.loggingIn() === false) {
		const secure = location.protocol === 'https:' ? '; secure' : '';

		document.cookie = `rc_uid=${escape(userId)}; path=/${secure}`;
		document.cookie = `rc_token=${escape(Accounts._storedLoginToken() as string)}; path=/${secure}`;
	}
});
