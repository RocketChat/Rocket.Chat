import { Meteor } from 'meteor/meteor';

import { updatePredictedVisitorAbandonment, updateQueueInactivityTimeout } from './Helper';
import { VisitorInactivityMonitor } from './VisitorInactivityMonitor';
import { MultipleBusinessHoursBehavior } from './business-hour/Multiple';
import { logger } from './logger';
import { businessHourManager } from '../../../../server/lib/omnichannel/business-hour';
import { SingleBusinessHourBehavior } from '../../../../server/lib/omnichannel/business-hour/Single';
import { settings } from '../../../../server/settings';

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
		logger.debug({ msg: 'Changing business hour type', value });
		if (!Object.keys(businessHours).includes(value)) {
			logger.error({ msg: 'Invalid business hour type', value });
			return;
		}
		businessHourManager.registerBusinessHourBehavior(businessHours[value as keyof typeof businessHours]);
		if (settings.get('Livechat_enable_business_hours')) {
			await businessHourManager.restartManager();
			logger.debug('Business hour manager started');
		}
	});
});
