import { Meteor } from 'meteor/meteor';

import { businessHourManager } from '../../../../app/livechat/server/business-hour';
import { SingleBusinessHourBehavior } from '../../../../app/livechat/server/business-hour/Single';
import { settings } from '../../../../app/settings/server';
import { resetDefaultBusinessHourIfNeeded } from './business-hour/Helper';
import { MultipleBusinessHoursBehavior } from './business-hour/Multiple';
import { updatePredictedVisitorAbandonment, updateQueueInactivityTimeout } from './lib/Helper';
import { VisitorInactivityMonitor } from './lib/VisitorInactivityMonitor';
import { logger } from './lib/logger';
import './lib/query.helper';

const visitorActivityMonitor = new VisitorInactivityMonitor();
const businessHours = {
	Multiple: new MultipleBusinessHoursBehavior(),
	Single: new SingleBusinessHourBehavior(),
};

settings.change('Livechat_max_queue_wait_time', async () => {
	await updateQueueInactivityTimeout();
});

Meteor.startup(async () => {
	settings.watch('Livechat_abandoned_rooms_action', async (value) => {
		await updatePredictedVisitorAbandonment();
		if (!value || value === 'none') {
			return visitorActivityMonitor.stop();
		}
		await visitorActivityMonitor.start();
	});
	settings.change('Livechat_visitor_inactivity_timeout', async () => {
		await updatePredictedVisitorAbandonment();
	});
	settings.change<string>('Livechat_business_hour_type', async (value) => {
		logger.debug(`Changing business hour type to ${value}`);
		if (!Object.keys(businessHours).includes(value)) {
			logger.error(`Invalid business hour type ${value}`);
			return;
		}
		businessHourManager.registerBusinessHourBehavior(businessHours[value as keyof typeof businessHours]);
		if (settings.get('Livechat_enable_business_hours')) {
			await businessHourManager.restartManager();
			logger.debug(`Business hour manager started`);
		}
	});

	await resetDefaultBusinessHourIfNeeded();
});
