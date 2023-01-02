import { Meteor } from 'meteor/meteor';
import _ from 'underscore';

import { hasPermission } from '../../../authorization';
import { Users } from '../../../models/server';
import { methodDeprecationLogger } from '../../../lib/server/lib/deprecationWarningLogger';

Meteor.methods({
	'livechat:searchAgent'(username) {
		methodDeprecationLogger.warn('livechat:searchAgent will be deprecated in future versions of Rocket.Chat');

		if (!Meteor.userId() || !hasPermission(Meteor.userId(), 'view-livechat-manager')) {
			throw new Meteor.Error('error-not-allowed', 'Not allowed', {
				method: 'livechat:searchAgent',
			});
		}

		if (!username || !_.isString(username)) {
			throw new Meteor.Error('error-invalid-arguments', 'Invalid arguments', {
				method: 'livechat:searchAgent',
			});
		}

		const user = Users.findOneByUsernameIgnoringCase(username, { fields: { _id: 1, username: 1 } });

		if (!user) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user', {
				method: 'livechat:searchAgent',
			});
		}

		return user;
	},
});
