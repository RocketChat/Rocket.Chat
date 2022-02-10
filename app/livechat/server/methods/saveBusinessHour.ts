import { Meteor } from 'meteor/meteor';

import { ILivechatBusinessHour } from '../../../../definition/ILivechatBusinessHour';
import { businessHourManager } from '../business-hour';

Meteor.methods({
	'livechat:saveBusinessHour'(businessHourData: ILivechatBusinessHour) {
		try {
			Promise.await(businessHourManager.saveBusinessHour(businessHourData));
		} catch (e: unknown) {
			const message = e instanceof Error || e instanceof Meteor.Error ? e.message : '';
			throw new Meteor.Error(message);
		}
	},
});
