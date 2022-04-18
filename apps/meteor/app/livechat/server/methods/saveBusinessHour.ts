import { Meteor } from 'meteor/meteor';
import type { ILivechatBusinessHour } from '@rocket.chat/core-typings';

import { businessHourManager } from '../business-hour';

Meteor.methods({
	'livechat:saveBusinessHour'(businessHourData: ILivechatBusinessHour) {
		try {
			Promise.await(businessHourManager.saveBusinessHour(businessHourData));
		} catch (e) {
			throw new Meteor.Error(e.message);
		}
	},
});
