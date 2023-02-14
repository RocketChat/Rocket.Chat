import { Meteor } from 'meteor/meteor';

import { hasPermission } from '../../../authorization';
import { LivechatEnterprise } from '../../../../ee/app/livechat-enterprise/server/lib/LivechatEnterprise';

Meteor.methods({
	async 'livechat:saveDepartment'(_id, departmentData, departmentAgents) {
		if (!Meteor.userId() || !hasPermission(Meteor.userId(), 'manage-livechat-departments')) {
			throw new Meteor.Error('error-not-allowed', 'Not allowed', {
				method: 'livechat:saveDepartment',
			});
		}

		return LivechatEnterprise.saveDepartment(_id, departmentData, { upsert: departmentAgents });
	},
});
