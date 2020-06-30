import { Meteor } from 'meteor/meteor';

import { settings } from '../../../../app/settings';
import { checkWaitingQueue, updatePredictedVisitorAbandonment } from './lib/Helper';
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

Meteor.startup(async function() {
	settings.onload('Livechat_maximum_chats_per_agent', function(/* key, value */) {
		checkWaitingQueue();
	});
	settings.onload('Livechat_auto_close_abandoned_rooms', function(_, value) {
		updatePredictedVisitorAbandonment();
		if (!value) {
			return visitorActivityMonitor.stop();
		}
		visitorActivityMonitor.start();
	});
	settings.onload('Livechat_visitor_inactivity_timeout', function() {
		updatePredictedVisitorAbandonment();
	});
	settings.onload('Livechat_business_hour_type', (_, value) => {
		businessHourManager.registerBusinessHourBehavior(businessHours[value]);
		businessHourManager.startManager();
	});
	await resetDefaultBusinessHourIfNeeded();
});
