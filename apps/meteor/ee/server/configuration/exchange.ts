import { Calendar } from '@rocket.chat/core-services';
import { License } from '@rocket.chat/license';
import { Meteor } from 'meteor/meteor';

import { detachExchangeProvider, registerExchangeProviderWatchers } from '../lib/exchange/ExchangeProviderRegistry';
import { registerCalendarSyncJob } from '../lib/exchange/sync/calendar/registerCalendarSyncJob';
import { registerContactSyncJob } from '../lib/exchange/sync/contacts/registerContactSyncJob';
import { addSettings } from '../settings/exchange';

Meteor.startup(async () => {
	let stopProviderWatcher: (() => void) | undefined;
	let stopCalendarSyncWatcher: (() => void) | undefined;
	let stopContactSyncWatcher: (() => void) | undefined;

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
			stopCalendarSyncWatcher = registerCalendarSyncJob();
			stopContactSyncWatcher = registerContactSyncJob();
		},
		down: () => {
			generation += 1;

			stopProviderWatcher?.();
			stopCalendarSyncWatcher?.();
			stopContactSyncWatcher?.();

			stopProviderWatcher = undefined;
			stopCalendarSyncWatcher = undefined;
			stopContactSyncWatcher = undefined;

			detachExchangeProvider();
		},
	});
});
