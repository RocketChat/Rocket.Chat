import { Meteor } from 'meteor/meteor';

import { callbacks } from '../../../lib/callbacks';
import { afterLogoutCleanUpCallback } from '../../../lib/callbacks/afterLogoutCleanUpCallback';

Meteor.startup(() => {
	const purgeAllDrafts = (): void => {
		Object.keys(localStorage)
			.filter((key) => key.indexOf('messagebox_') === 0)
			.forEach((key) => localStorage.removeItem(key));
	};

	afterLogoutCleanUpCallback.add(purgeAllDrafts, callbacks.priority.MEDIUM, 'chatMessages-after-logout-cleanup');
});
