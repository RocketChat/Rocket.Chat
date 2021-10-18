import { Meteor } from 'meteor/meteor';
import { Promise } from 'meteor/promise';

import { hasPermission } from '../../../../../app/authorization/server';
import { businessHourManager } from '../../../../../app/livechat/server/business-hour';

Meteor.methods({
	'livechat:removeBusinessHour'(id: string, type: string) {
		if (!Meteor.userId() || !hasPermission(Meteor.userId(), 'view-livechat-business-hours')) {
			throw new Meteor.Error('error-not-allowed', 'Not allowed', { method: 'livechat:removeBusinessHour' });
		}

		return Promise.await(businessHourManager.removeBusinessHourByIdAndType(id, type));
	},
});
