import { Meteor } from 'meteor/meteor';

Meteor.methods({
	getFullUserData({ filter = '', username = '', limit = 1 }) {
		const result = RocketChat.getFullUserData({ userId: Meteor.userId(), filter: filter || username, limit });
		return result && result.fetch();
	},
});
