import { Accounts } from 'meteor/accounts-base';
import { Meteor } from 'meteor/meteor';
import { Tracker } from 'meteor/tracker';

Tracker.autorun(() => {
	const userId = Meteor.userId();

	if (userId) {
		const secure = location.protocol === 'https:' ? '; secure' : '';

		document.cookie = `rc_uid=${escape(userId)}; path=/${secure}`;
		document.cookie = `rc_token=${escape(Accounts._storedLoginToken() as string)}; path=/${secure}`;
	}
});
