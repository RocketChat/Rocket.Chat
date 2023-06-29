import { Meteor } from 'meteor/meteor';
import { cronJobs } from '@rocket.chat/cron';
import type { IUser } from '@rocket.chat/core-typings';
import { Accounts } from 'meteor/accounts-base';

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

	Accounts.onLogin(({ user }: { user: IUser }) => {
		void (user?.roles?.includes('livechat-agent') && !user?.roles?.includes('bot') && businessHourManager.onLogin(user._id));
	});
});
