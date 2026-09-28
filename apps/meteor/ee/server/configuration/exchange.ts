import { Calendar } from '@rocket.chat/core-services';
import { License } from '@rocket.chat/license';

import { detachExchangeProvider, registerExchangeProviderWatchers } from '../lib/exchange/ExchangeProviderRegistry';
import { registerCalendarSyncJob } from '../lib/exchange/sync/calendar/registerCalendarSyncJob';
import { addSettings } from '../settings/exchange';

export const configureOutlookCalendar = async (): Promise<void> => {
	let stopProviderWatcher: (() => void) | undefined;
	let stopSyncWatcher: (() => void) | undefined;

	License.onToggledFeature('outlook-calendar', {
		up: async () => {
			await addSettings();

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
};
