import { Calendar } from '@rocket.chat/core-services';
import { License } from '@rocket.chat/license';
import { Meteor } from 'meteor/meteor';

import { detachExchangeProvider, registerExchangeProviderWatchers } from '../lib/exchange/ExchangeProviderRegistry';
import { registerExchangeSyncJob } from '../lib/exchange/sync/calendar/registerExchangeSyncJob';
import { registerContactSyncJob } from '../lib/exchange/sync/contacts/registerContactSyncJob';
import { addSettings } from '../settings/exchange';

Meteor.startup(async () => {
	let stopProviderWatcher: (() => void) | undefined;
	let stopCalendarSyncWatcher: (() => void) | undefined;
	let stopContactSyncWatcher: (() => void) | undefined;

	License.onToggledFeature('outlook-calendar', {
		up: async () => {
			addSettings();

			await Calendar.setupNextNotification();
			await Calendar.setupNextStatusChange();

			stopProviderWatcher = registerExchangeProviderWatchers();
			stopCalendarSyncWatcher = registerExchangeSyncJob();
			stopContactSyncWatcher = registerContactSyncJob();
		},
		down: () => {
			stopProviderWatcher?.();
			stopCalendarSyncWatcher?.();
			stopContactSyncWatcher?.();

			detachExchangeProvider();
		},
	});
});
