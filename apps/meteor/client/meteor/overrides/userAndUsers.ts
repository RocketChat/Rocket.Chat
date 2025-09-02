import { Accounts } from 'meteor/accounts-base';
import { Meteor } from 'meteor/meteor';
import { Tracker } from 'meteor/tracker';

import { userIdStore } from '../../lib/user';
import { Users } from '../../stores/Users';
import { watchUser, watchUserId } from '../user';

Tracker.autorun(() => {
	const userId = Accounts.connection.userId() ?? undefined;
	userIdStore.setState(userId);
});

Meteor.userId = () => watchUserId() ?? null;

// overwrite Meteor.users collection so records on it don't get erased whenever the client reconnects to websocket
Meteor.user = () => (watchUser() as Meteor.User | undefined) ?? null;

// assertion is needed because IUser has more obligatory fields than Meteor.User
Meteor.users = Users.collection as unknown as typeof Meteor.users;
