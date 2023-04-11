import { Meteor } from 'meteor/meteor';
import { Accounts } from 'meteor/accounts-base';

import { BusinessHourManager } from './BusinessHourManager';
import { SingleBusinessHourBehavior } from './Single';
import { callbacks } from '../../../../lib/callbacks';
import { DefaultBusinessHour } from './Default';
import { BusinessHourCronJob } from './Helper';

export const businessHourManager = new BusinessHourManager(new BusinessHourCronJob());

Meteor.startup(() => {
	const { BusinessHourBehaviorClass } = callbacks.run('on-business-hour-start', {
		BusinessHourBehaviorClass: SingleBusinessHourBehavior,
	});
	businessHourManager.registerBusinessHourBehavior(new BusinessHourBehaviorClass());
	businessHourManager.registerBusinessHourType(new DefaultBusinessHour());

	Accounts.onLogin(
		async ({ user }: { user: any }) =>
			user?.roles?.includes('livechat-agent') && !user?.roles?.includes('bot') && businessHourManager.onLogin(user._id),
	);
});
