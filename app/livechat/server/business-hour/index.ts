import { Meteor } from 'meteor/meteor';

import { BusinessHourManager } from './BusinessHourManager';
import { SingleBusinessHour } from './Single';
import { cronJobs } from '../../../utils/server/lib/cron/Cronjobs';
import { callbacks } from '../../../callbacks/server';
import { IBusinessHour } from './AbstractBusinessHour';

export const businessHourManager = new BusinessHourManager();

Meteor.startup(() => {
	const { BusinessHourClass } = callbacks.run('on-business-hour-start', { BusinessHourClass: SingleBusinessHour });
	businessHourManager.onStartBusinessHourManager(new BusinessHourClass() as IBusinessHour, cronJobs);
});
