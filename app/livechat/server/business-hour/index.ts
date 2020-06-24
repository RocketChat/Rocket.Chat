import { Meteor } from 'meteor/meteor';

import { BusinessHourManager } from './BusinessHourManager';
import { SingleBusinessHour, SingleBusinessHourBehavior } from './Single';
import { cronJobs } from '../../../utils/server/lib/cron/Cronjobs';
import { callbacks } from '../../../callbacks/server';
import { IBusinessHour } from './AbstractBusinessHour';
import { DefaultBusinessHour } from './Default';

export const businessHourManager = new BusinessHourManager(cronJobs);

Meteor.startup(() => {
	const { BusinessHourBehaviorClass } = callbacks.run('on-business-hour-start', { BusinessHourBehaviorClass: SingleBusinessHourBehavior });
	businessHourManager.registerBusinessHourBehavior(new BusinessHourBehaviorClass());
	businessHourManager.registerBusinessHourType(new DefaultBusinessHour());
});
