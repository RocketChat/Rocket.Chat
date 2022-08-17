import { Meteor } from 'meteor/meteor';

import { settings } from '../../../../app/settings/server';
import { updatePredictedVisitorAbandonment, updateQueueInactivityTimeout } from './lib/Helper';
import { VisitorInactivityMonitor } from './lib/VisitorInactivityMonitor';
import './lib/query.helper';
import { MultipleBusinessHoursBehavior } from './business-hour/Multiple';
import { SingleBusinessHourBehavior } from '../../../../app/livechat/server/business-hour/Single';
import { businessHourManager } from '../../../../app/livechat/server/business-hour';
import { resetDefaultBusinessHourIfNeeded } from './business-hour/Helper';

const visitorActivityMonitor = new VisitorInactivityMonitor();
const businessHours = {
	Multiple: new MultipleBusinessHoursBehavior(),
	Single: new SingleBusinessHourBehavior(),
};

settings.change('Livechat_max_queue_wait_time', function () {
	updateQueueInactivityTimeout();
});

Meteor.startup(async function () {
	settings.watch('Livechat_abandoned_rooms_action', function (value) {
		Promise.await(updatePredictedVisitorAbandonment());
		if (!value || value === 'none') {
			return visitorActivityMonitor.stop();
		}
		visitorActivityMonitor.start();
	});
	settings.change('Livechat_visitor_inactivity_timeout', function () {
		Promise.await(updatePredictedVisitorAbandonment());
	});
	settings.change<string>('Livechat_business_hour_type', (value) => {
		if (!Object.keys(businessHours).includes(value)) {
			return;
		}
		businessHourManager.registerBusinessHourBehavior(businessHours[value as keyof typeof businessHours]);
		if (settings.get('Livechat_enable_business_hours')) {
			businessHourManager.startManager();
		}
	});

	await resetDefaultBusinessHourIfNeeded();
});
