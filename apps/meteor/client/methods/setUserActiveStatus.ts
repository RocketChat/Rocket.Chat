import { Meteor } from 'meteor/meteor';

Meteor.methods({
	setUserActiveStatus(userId, active) {
		Meteor.users.update(userId, { $set: { active } });
		return true;
	},
});
