import { Meteor } from 'meteor/meteor';

Meteor.methods({
	followUser(username) {
		console.log(`${ username } has been followed by ${ Meteor.user().username }`);
	},
});
