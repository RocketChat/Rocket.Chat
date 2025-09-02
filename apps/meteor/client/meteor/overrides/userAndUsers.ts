import { Accounts } from 'meteor/accounts-base';
import { Meteor } from 'meteor/meteor';
import { Tracker } from 'meteor/tracker';

import { userIdStore } from '../../lib/userId';
import { Users } from '../../stores/Users';
import { watch } from '../watch';
import { watchUserId } from '../watchUserId';

Tracker.autorun(() => {
	const userId = Accounts.connection.userId() ?? undefined;
	userIdStore.setState(userId);
});

Meteor.userId = () => watchUserId() ?? null;

// assertion is needed because IUser has more obligatory fields than Meteor.User
Meteor.users = Users.collection as unknown as typeof Meteor.users;

// overwrite Meteor.users collection so records on it don't get erased whenever the client reconnects to websocket
Meteor.user = () => {
	const userId = watchUserId();
	if (!userId) return null;
	return watch(Users.use, (state) => state.get(userId) as Meteor.User | undefined) ?? null;
};
