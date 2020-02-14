import { Meteor } from 'meteor/meteor';

import { Info } from '../../../utils';

Meteor.methods({
	getServerInfo() {
		return Info;
	},
});
