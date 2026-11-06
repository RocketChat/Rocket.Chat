import { Calendar } from '@rocket.chat/core-services';
import { License } from '@rocket.chat/license';

import { registerExchangeProviderWatchers } from '../lib/exchange/ExchangeProviderRegistry';
import { addSettings } from '../settings/exchange';

export const configureExchange = async (): Promise<void> => {
	await License.onLicense('outlook-calendar', async () => {
		await addSettings();

		await Calendar.setupNextNotification();
		await Calendar.setupNextStatusChange();

		registerExchangeProviderWatchers();
	});
};
