import { Meteor } from 'meteor/meteor';
import { Info } from 'meteor/rocketchat:utils';

Meteor.methods({
	getServerInfo() {
		return Info;
	},
});
