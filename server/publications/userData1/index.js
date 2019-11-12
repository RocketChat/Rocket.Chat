import { Meteor } from 'meteor/meteor';

import { Users } from '../../../app/models';
import { getDefaultUserFields } from '../../../app/utils/server/functions/getDefaultUserFields';
import './emitter';

Meteor.methods({
	'userData/get'() {
		if (!Meteor.userId()) {
			return [];
		}

		const userData = Users.find({ _id: Meteor.userId() }, {
			fields: getDefaultUserFields(),
		});

		return userData;
	},
});