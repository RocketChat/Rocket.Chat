import { Meteor } from 'meteor/meteor';

import { businessHourManager } from '../../../../app/livechat/client/views/app/business-hours/BusinessHours';
import type { IBusinessHourBehavior } from '../../../../app/livechat/client/views/app/business-hours/IBusinessHourBehavior';
import { settings } from '../../../../app/settings/client';
import { hasLicense } from '../../license/client';
import { EESingleBusinessHourBehaviour } from './SingleBusinessHour';
import { MultipleBusinessHoursBehavior } from './views/business-hours/Multiple';

const businessHours: Record<string, IBusinessHourBehavior> = {
	multiple: new MultipleBusinessHoursBehavior(),
	single: new EESingleBusinessHourBehaviour(),
};

Meteor.startup(() => {
	settings.onload('Livechat_business_hour_type', async (_, value) => {
		if (await hasLicense('livechat-enterprise')) {
			businessHourManager.registerBusinessHourBehavior(businessHours[(value as string).toLowerCase()]);
		}
	});
});
