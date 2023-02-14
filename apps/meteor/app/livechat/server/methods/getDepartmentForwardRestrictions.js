import { Meteor } from 'meteor/meteor';

import { callbacks } from '../../../../lib/callbacks';
import { methodDeprecationLogger } from '../../../lib/server/lib/deprecationWarningLogger';

Meteor.methods({
	'livechat:getDepartmentForwardRestrictions'(departmentId) {
		methodDeprecationLogger.warn('livechat:getDepartmentForwardRestrictions will be deprecated in future versions of Rocket.Chat');
		if (!Meteor.userId()) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user', {
				method: 'livechat:getDepartmentForwardRestrictions',
			});
		}

		const options = callbacks.run('livechat.onLoadForwardDepartmentRestrictions', { departmentId });
		const { restrictions } = options;

		return restrictions;
	},
});
