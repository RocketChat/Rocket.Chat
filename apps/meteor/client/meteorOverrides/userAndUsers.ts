import { Users } from '../../app/models/client/models/Users';

Meteor.users = Users as typeof Meteor.users;

// overwrite Meteor.users collection so records on it don't get erased whenever the client reconnects to websocket
Meteor.user = function user(): Meteor.User | null {
	const uid = Meteor.userId();

	if (!uid) {
		return null;
	}

	return (Users.findOne({ _id: uid }) ?? null) as Meteor.User | null;
};
