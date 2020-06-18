import { Meteor } from 'meteor/meteor';

import { MultipleBusinessHours } from './views/business-hours/MultipleBusinessHours';
import { SingleBusinessHour } from '../../../../app/livechat/client/views/app/business-hours/Single';
import { settings } from '../../../../app/settings/client';
import { businessHourManager } from '../../../../app/livechat/client/views/app/business-hours/BusinessHours';
import { IBusinessHour } from '../../../../app/livechat/client/views/app/business-hours/IBusinessHour';

const businessHours: Record<string, IBusinessHour> = {
	Multiple: new MultipleBusinessHours(),
	Single: new SingleBusinessHour(),
};

Meteor.startup(function() {
	settings.onload('Livechat_business_hour_type', (_, value) => {
		businessHourManager.registerBusinessHourMethod(businessHours[value as string]);
	});
});
