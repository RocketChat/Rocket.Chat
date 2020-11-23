import { Meteor } from 'meteor/meteor';

import { settings } from '../../../../app/settings';
import { updatePredictedVisitorAbandonment } from './lib/Helper';
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
		if (settings.get('Livechat_enable_business_hours')) {
			businessHourManager.startManager();
		}
	});
	await resetDefaultBusinessHourIfNeeded();
});
