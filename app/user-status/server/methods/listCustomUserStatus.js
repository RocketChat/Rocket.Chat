import { Meteor } from 'meteor/meteor';

import { CustomUserStatus } from '../../../models';

Meteor.methods({
	listCustomUserStatus() {
		return CustomUserStatus.find({}).fetch();
	},
});
