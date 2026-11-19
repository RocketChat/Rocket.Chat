import {
	EwsTransport,
	EwsTransportPool,
	ExchangeEwsProvider,
	MAILBOX_CONCURRENCY,
	MicrosoftGraphProvider,
	logger,
	setCalendarSyncWindowDays,
	setExchangeProvider,
} from '@rocket.chat/exchange';
import type { EwsTransportConfig, IExchangeProvider } from '@rocket.chat/exchange';

import { settings } from '../../../../server/settings';
import { getCalendarSyncWindowDays } from '../../../lib/exchange/calendarSyncSchedule';

const WATCHED_SETTINGS = [
	'Outlook_Calendar_Enabled',
	'Exchange_Mode',
	'Exchange_Sync_Provider',
	'Exchange_Graph_Tenant_Id',
	'Exchange_Graph_Client_Id',
	'Exchange_Graph_Client_Secret',
	'Exchange_Graph_Authority_Host',
	'Exchange_Graph_Host',
	'Exchange_EWS_Url',
	'Exchange_EWS_Username',
	'Exchange_EWS_Password',
	'Exchange_EWS_Auth_Method',
	'Exchange_EWS_CA_Cert',
	'Exchange_EWS_Reject_Unauthorized',
];

const buildExchangeProvider = (): IExchangeProvider | undefined => {
	if (!settings.get<boolean>('Outlook_Calendar_Enabled') || settings.get<string>('Exchange_Mode') !== 'server') {
		return undefined;
	}

	const providerId = settings.get<string>('Exchange_Sync_Provider');

	switch (providerId) {
		case 'graph':
			return new MicrosoftGraphProvider({
				tenantId: settings.get<string>('Exchange_Graph_Tenant_Id'),
				clientId: settings.get<string>('Exchange_Graph_Client_Id'),
				clientSecret: settings.get<string>('Exchange_Graph_Client_Secret'),
				authorityHost: settings.get<string>('Exchange_Graph_Authority_Host') || undefined,
				graphHost: settings.get<string>('Exchange_Graph_Host') || undefined,
			});

		case 'ews': {
			const config: EwsTransportConfig = {
				url: settings.get<string>('Exchange_EWS_Url'),
				username: settings.get<string>('Exchange_EWS_Username'),
				password: settings.get<string>('Exchange_EWS_Password'),
				authMethod: settings.get<string>('Exchange_EWS_Auth_Method') === 'basic' ? 'basic' : 'ntlm',
				caCert: settings.get<string>('Exchange_EWS_CA_Cert') || undefined,
				rejectUnauthorized: settings.get<boolean>('Exchange_EWS_Reject_Unauthorized') !== false,
			};

			return new ExchangeEwsProvider(
				new EwsTransportPool(MAILBOX_CONCURRENCY, () => new EwsTransport(config)),
				settings.get<string>('Exchange_EWS_Username'),
			);
		}

		default:
			logger.error({ msg: 'Unknown Exchange provider configured', providerId });
			return undefined;
	}
};

export const registerExchangeProviderWatchers = () => {
	setCalendarSyncWindowDays(() => getCalendarSyncWindowDays(settings.get<number>('Exchange_Calendar_Sync_Window_Days')));

	return settings.watchMultiple(WATCHED_SETTINGS, () => {
		let provider: IExchangeProvider | undefined;

		try {
			provider = buildExchangeProvider();
		} catch (err) {
			logger.error({ msg: 'Could not build the Exchange provider from the current settings', err });
		}

		setExchangeProvider(provider);

		logger.debug({ msg: 'Exchange provider rebuilt', provider: provider?.id ?? 'none' });
	});
};
