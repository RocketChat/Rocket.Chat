import { Meteor } from 'meteor/meteor';

import { callbacks } from '../../../../lib/callbacks';

Meteor.methods({
	'livechat:getDepartmentForwardRestrictions'(departmentId) {
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
