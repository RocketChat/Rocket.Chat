import type { IUser } from '@rocket.chat/core-typings';
import { cronJobs } from '@rocket.chat/cron';
import { Accounts } from 'meteor/accounts-base';
import { Meteor } from 'meteor/meteor';

import { callbacks } from '../../../../lib/callbacks';
import { BusinessHourManager } from './BusinessHourManager';
import { DefaultBusinessHour } from './Default';
import { SingleBusinessHourBehavior } from './Single';

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
