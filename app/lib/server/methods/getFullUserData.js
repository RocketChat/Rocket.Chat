import { Meteor } from 'meteor/meteor';
import { getFullUserData } from '../functions';

Meteor.methods({
	getFullUserData({ filter = '', username = '', limit = 1 }) {
		const result = getFullUserData({ userId: Meteor.userId(), filter: filter || username, limit });
		return result && result.fetch();
	},
});
