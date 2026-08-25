import { Calendar } from '@rocket.chat/core-services';
import { License } from '@rocket.chat/license';

import { registerExchangeProviderWatchers } from '../lib/exchange/ExchangeProviderRegistry';
import { addSettings } from '../settings/outlookCalendar';

export const configureOutlookCalendar = async (): Promise<void> => {
	await License.onLicense('outlook-calendar', async () => {
		addSettings();

		await Calendar.setupNextNotification();
		await Calendar.setupNextStatusChange();

		registerExchangeProviderWatchers();
	});
};
