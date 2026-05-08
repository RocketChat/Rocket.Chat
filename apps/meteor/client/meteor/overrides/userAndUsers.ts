// TODO: remove this override together with the Meteor webapp/DDP/Accounts layer —
// it bridges Meteor's Accounts.connection userId reactive source to the Zustand
// userIdStore and keeps Meteor.userId / Meteor.user / Meteor.users pointing at
// the local Zustand collection. Naively replacing Tracker.autorun with
// Accounts.onLogin/onLogout breaks callers (e.g. UserProvider's logoutCleanUp)
// that read userIdStore from within other onLogout callbacks and depend on the
// async Tracker.flush ordering to still see a truthy uid.
import { Accounts } from 'meteor/accounts-base';
import { Meteor } from 'meteor/meteor';
import { Tracker } from 'meteor/tracker';

import { userIdStore } from '../../lib/user';
import { Users } from '../../stores/Users';
import { MinimongoCollection } from '../minimongo/MinimongoCollection';
import { watchUser, watchUserId } from '../user';

Tracker.autorun(() => {
	const userId = Accounts.connection.userId() ?? undefined;
	userIdStore.setState(userId);
});

const collection = new MinimongoCollection(Users.use);

Users.hooks.onInvalidate = (...docs) => {
	collection.scheduleRecomputationsFor(docs);
};

Users.hooks.onInvalidateAll = () => {
	collection.recomputeAll();
};

Meteor.userId = () => watchUserId() ?? null;

// overwrite Meteor.users collection so records on it don't get erased whenever the client reconnects to websocket
Meteor.user = () => (watchUser() as Meteor.User | undefined) ?? null;

// assertion is needed because IUser has more obligatory fields than Meteor.User
Meteor.users = collection as unknown as typeof Meteor.users;
