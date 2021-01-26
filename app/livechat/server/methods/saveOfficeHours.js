import { Meteor } from 'meteor/meteor';

import { hasPermission } from '../../../authorization';
import { LivechatBusinessHours } from '../../../models/server/raw';

Meteor.methods({
	'livechat:saveOfficeHours'(day, start, finish, open) {
		console.warn('Method "livechat:saveOfficeHour" is deprecated and will be removed after v4.0.0');

		if (!Meteor.userId() || !hasPermission(Meteor.userId(), 'view-livechat-business-hours')) {
			throw new Meteor.Error('error-not-allowed', 'Not allowed', { method: 'livechat:saveOfficeHours' });
		}

		LivechatBusinessHours.updateDayOfGlobalBusinessHour({
			day,
			start,
			finish,
			open,
		});
	},
});
