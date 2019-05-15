import { Meteor } from 'meteor/meteor';

import { Users } from '../../app/models';
import { getDefaultUserFields } from '../../app/utils/server/functions/getDefaultUserFields';

Meteor.publish('userData', function() {
	if (!this.userId) {
		return this.ready();
	}

	return Users.find(this.userId, {
		fields: getDefaultUserFields(),
	});
});
