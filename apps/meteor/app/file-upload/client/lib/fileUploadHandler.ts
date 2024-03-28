import { Accounts } from 'meteor/accounts-base';
import { Meteor } from 'meteor/meteor';
import { Tracker } from 'meteor/tracker';

Tracker.autorun(() => {
	const userId = Meteor.userId();

	if (userId) {
		const secure = location.protocol === 'https:' ? '; secure' : '; secure';  // Always secure

		document.cookie = `rc_uid=${escape(userId)}; path=/${secure}; HttpOnly`;
		document.cookie = `rc_token=${escape(Accounts._storedLoginToken() as string)}; path=/${secure}; HttpOnly`;
	}
});
