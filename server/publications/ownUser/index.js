import { Meteor } from 'meteor/meteor';

import { Users } from '../../../app/models';
import { getDefaultUserFields } from '../../../app/utils/server/functions/getDefaultUserFields';
import './emitter';

Meteor.methods({
	'ownUser/get'() {
		if (!Meteor.userId()) {
			return [];
		}

		const data = Users.find({ _id: Meteor.userId() }, { fields: getDefaultUserFields() }).fetch();
		return data;
	},
});
