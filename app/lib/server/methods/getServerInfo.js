import { Meteor } from 'meteor/meteor';
import { Info } from '/app/utils';

Meteor.methods({
	getServerInfo() {
		return Info;
	},
});
