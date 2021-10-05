import { Meteor } from 'meteor/meteor';

import { ILivechatBusinessHour } from '../../../../definition/ILivechatBusinessHour';
import { businessHourManager } from '../business-hour';

Meteor.methods({
	'livechat:saveBusinessHour'(businessHourData: ILivechatBusinessHour) {
		businessHourManager.saveBusinessHour(businessHourData);
	},
});
