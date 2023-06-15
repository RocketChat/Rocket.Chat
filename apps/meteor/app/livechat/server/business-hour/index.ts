import { Meteor } from 'meteor/meteor';
import { Accounts } from 'meteor/accounts-base';
import { cronJobs } from '@rocket.chat/cron';

import { BusinessHourManager } from './BusinessHourManager';
import { SingleBusinessHourBehavior } from './Single';
import { callbacks } from '../../../../lib/callbacks';
import { DefaultBusinessHour } from './Default';

export const businessHourManager = new BusinessHourManager(cronJobs);

Meteor.startup(async () => {
	const { BusinessHourBehaviorClass } = await callbacks.run('on-business-hour-start', {
		BusinessHourBehaviorClass: SingleBusinessHourBehavior,
	});
	businessHourManager.registerBusinessHourBehavior(new BusinessHourBehaviorClass());
	businessHourManager.registerBusinessHourType(new DefaultBusinessHour());

	Accounts.onLogin(
		async ({ user }: { user: any }) =>
			user?.roles?.includes('livechat-agent') && !user?.roles?.includes('bot') && businessHourManager.onLogin(user._id),
	);
});
