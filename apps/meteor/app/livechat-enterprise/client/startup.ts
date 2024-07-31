import { Meteor } from 'meteor/meteor';

import { hasLicense } from '../../license/client';
import { businessHourManager } from '../../livechat/client/views/app/business-hours/BusinessHours';
import type { IBusinessHourBehavior } from '../../livechat/client/views/app/business-hours/IBusinessHourBehavior';
import { SingleBusinessHourBehavior } from '../../livechat/client/views/app/business-hours/Single';
import { settings } from '../../settings/client';
import { MultipleBusinessHoursBehavior } from './views/business-hours/Multiple';

const businessHours: Record<string, IBusinessHourBehavior> = {
	multiple: new MultipleBusinessHoursBehavior(),
	single: new SingleBusinessHourBehavior(),
};

Meteor.startup(() => {
	Tracker.autorun(async () => {
		const bhType = settings.get<string>('Livechat_business_hour_type');
		if (bhType && (await hasLicense('livechat-enterprise'))) {
			businessHourManager.registerBusinessHourBehavior(businessHours[bhType.toLowerCase()]);
		}
	});
});
