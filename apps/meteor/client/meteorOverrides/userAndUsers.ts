import { Tracker } from 'meteor/tracker';

import { Users } from '../../app/models/client/models/Users';

Meteor.users = Users as unknown as typeof Meteor.users;

const dep = new Tracker.Dependency();

// overwrite Meteor.users collection so records on it don't get erased whenever the client reconnects to websocket
Tracker.autorun(() => {
	Meteor.user = function user(): Meteor.User | null {
		const uid = Meteor.userId();

		if (!uid) {
			return null;
		}

		dep.depend();
		Users.use.subscribe((state, prevState) => {
			if (state.has(uid) && prevState.has(uid)) {
				return;
			}
			dep.changed();
		});

		const user = Users.state.get(uid);
		return (user ?? null) as Meteor.User | null;
	};
});
