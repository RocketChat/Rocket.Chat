import { Meteor } from 'meteor/meteor';

import { MultipleBusinessHoursBehavior } from './views/business-hours/Multiple';
import { settings } from '../../../../app/settings/client';
import { businessHourManager } from '../../../../app/livechat/client/views/app/business-hours/BusinessHours';
import type { IBusinessHourBehavior } from '../../../../app/livechat/client/views/app/business-hours/IBusinessHourBehavior';
import { EESingleBusinessHourBehaviour } from './SingleBusinessHour';
import { hasLicense } from '../../license/client';

const businessHours: Record<string, IBusinessHourBehavior> = {
	Multiple: new MultipleBusinessHoursBehavior(),
	Single: new EESingleBusinessHourBehaviour(),
};

Meteor.startup(function () {
	settings.onload('Livechat_business_hour_type', async (_, value) => {
		if (await hasLicense('livechat-enterprise')) {
			businessHourManager.registerBusinessHourBehavior(businessHours[value as string]);
		}
	});
});
