import { Calendar } from '@rocket.chat/core-services';
import { License } from '@rocket.chat/license';
import { Meteor } from 'meteor/meteor';

import { detachExchangeProvider, registerExchangeProviderWatchers } from '../lib/exchange/ExchangeProviderRegistry';
import { registerCalendarSyncJob } from '../lib/exchange/sync/calendar/registerCalendarSyncJob';
import { addSettings } from '../settings/exchange';

Meteor.startup(async () => {
	let stopProviderWatcher: (() => void) | undefined;
	let stopSyncWatcher: (() => void) | undefined;

	// Added because 'up' could finish registering after `down` and that would keep syncing unlicensed
	let generation = 0;

	License.onToggledFeature('outlook-calendar', {
		up: async () => {
			const started = ++generation;

			await addSettings();

			await Calendar.setupNextNotification();
			await Calendar.setupNextStatusChange();

			if (generation !== started) {
				return;
			}

			stopProviderWatcher = registerExchangeProviderWatchers();
			stopSyncWatcher = registerCalendarSyncJob();
		},
		down: () => {
			generation += 1;

			stopProviderWatcher?.();
			stopSyncWatcher?.();
			stopProviderWatcher = undefined;
			stopSyncWatcher = undefined;

			detachExchangeProvider();
		},
	});
});
