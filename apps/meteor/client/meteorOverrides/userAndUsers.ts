import { Tracker } from 'meteor/tracker';

import { Users } from '../../app/models/client/models/Users';

Meteor.users = Users as unknown as typeof Meteor.users;

const dep = new Tracker.Dependency();

Tracker.autorun((computation) => {
	const currentUid = Meteor.userId();
	if (currentUid) {
		const unsubscribe = Users.use.subscribe((state, prevState) => {
			if (state.has(currentUid) && prevState.has(currentUid)) {
				dep.changed();
			}
		});
		computation.onInvalidate(() => {
			unsubscribe?.();
		});
		return;
	}
	dep.changed();
});

// overwrite Meteor.users collection so records on it don't get erased whenever the client reconnects to websocket
Meteor.user = function user(): Meteor.User | null {
	dep.depend();
	const uid = Meteor.userId();

	if (!uid) {
		return null;
	}

	const user = Users.state.get(uid);
	return (user ?? null) as Meteor.User | null;
};
