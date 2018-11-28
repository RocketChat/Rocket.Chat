import { Meteor } from 'meteor/meteor';

Meteor.methods({
	getServerInfo() {
		return RocketChat.Info;
	},
});
