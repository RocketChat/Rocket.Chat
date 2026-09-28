import { Calendar } from '@rocket.chat/core-services';
import { License } from '@rocket.chat/license';
import { Meteor } from 'meteor/meteor';

import { detachExchangeProvider, registerExchangeProviderWatchers } from '../lib/exchange/ExchangeProviderRegistry';
import { registerCalendarSyncJob } from '../lib/exchange/sync/calendar/registerCalendarSyncJob';
import { addSettings } from '../settings/exchange';

Meteor.startup(async () => {
	let stopProviderWatcher: (() => void) | undefined;
	let stopSyncWatcher: (() => void) | undefined;

	License.onToggledFeature('outlook-calendar', {
		up: async () => {
			addSettings();

			await Calendar.setupNextNotification();
			await Calendar.setupNextStatusChange();

			stopProviderWatcher = registerExchangeProviderWatchers();
			stopSyncWatcher = registerCalendarSyncJob();
		},
		down: () => {
			stopProviderWatcher?.();
			stopSyncWatcher?.();

			detachExchangeProvider();
		},
	});
});
