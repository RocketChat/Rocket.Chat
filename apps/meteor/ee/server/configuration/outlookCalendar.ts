import { Calendar } from '@rocket.chat/core-services';
import { License } from '@rocket.chat/license';
import { Meteor } from 'meteor/meteor';

import { detachExchangeProvider, registerExchangeProviderWatchers } from '../lib/exchange/ExchangeProviderRegistry';
import { registerExchangeSyncJob } from '../lib/exchange/sync/registerExchangeSyncJob';
import { addSettings } from '../settings/outlookCalendar';

Meteor.startup(async () => {
	let stopProviderWatcher: (() => void) | undefined;
	let stopSyncWatcher: (() => void) | undefined;

	License.onToggledFeature('outlook-calendar', {
		up: async () => {
			addSettings();

			await Calendar.setupNextNotification();
			await Calendar.setupNextStatusChange();

			stopProviderWatcher = registerExchangeProviderWatchers();
			stopSyncWatcher = registerExchangeSyncJob();
		},
		down: () => {
			stopProviderWatcher?.();
			stopSyncWatcher?.();

			detachExchangeProvider();
		},
	});
});
