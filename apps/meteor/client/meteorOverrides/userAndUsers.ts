import type { IUser } from '@rocket.chat/core-typings';
import { Tracker } from 'meteor/tracker';

import { Users } from '../stores/Users';

// assertion is needed because global Mongo.Collection differs from the `meteor/mongo` package's Mongo.Collection
Meteor.users = Users.collection as typeof Meteor.users;

const dep = new Tracker.Dependency();
let currentUser: IUser | undefined;

// Watch Meteor.userId() changes
Tracker.autorun(() => {
	const uid = Meteor.userId();

	// This will only run when the current user has changed; there is no need to validate by referential equality
	currentUser = uid ? Users.state.get(uid) : undefined;
	dep.changed();
});

// Watch user store changes
Users.use.subscribe((state) => {
	// Tracker.nonreactive is used here just to highlight that this is not a reactive computation.
	// At the module level, there is almost zero chance of Tracker.active being set.
	const uid = Tracker.nonreactive(() => Meteor.userId());

	// This lookup is fast enough to be called whenever the user store changes
	const user = uid ? state.get(uid) : undefined;

	if (user !== currentUser) {
		currentUser = user;
		dep.changed();
	}
});

// overwrite Meteor.users collection so records on it don't get erased whenever the client reconnects to websocket
Meteor.user = function user(): Meteor.User | null {
	dep.depend();
	return (currentUser ?? null) as Meteor.User | null;
};
