import type { IExchangeProvider } from './definition/IExchangeProvider';
import type { DateRange } from './definition/types';
import { ExchangeError } from './errors';
import { ExchangeEwsProvider } from './ews/ExchangeEwsProvider';
import { NtlmEwsTransport } from './ews/NtlmEwsTransport';
import { MicrosoftGraphProvider } from './graph/MicrosoftGraphProvider';
import { logger } from './logger';
import { scrubForLog } from './scrub';
import { settings } from '../../../../server/settings';

const WATCHED_SETTINGS = [
	'Outlook_Calendar_Enabled',
	'Outlook_Calendar_Mode',
	'Outlook_Calendar_Server_Sync_Provider',
	'Outlook_Calendar_Graph_Tenant_Id',
	'Outlook_Calendar_Graph_Client_Id',
	'Outlook_Calendar_Graph_Client_Secret',
	'Outlook_Calendar_Graph_Authority_Host',
	'Outlook_Calendar_Graph_Host',
	'Outlook_Calendar_EWS_Url',
	'Outlook_Calendar_EWS_Username',
	'Outlook_Calendar_EWS_Password',
	'Outlook_Calendar_EWS_Auth_Method',
	'Outlook_Calendar_EWS_CA_Cert',
	'Outlook_Calendar_EWS_Reject_Unauthorized',
];

let current: IExchangeProvider | undefined;

const buildExchangeProvider = (): IExchangeProvider | undefined => {
	if (!settings.get<boolean>('Outlook_Calendar_Enabled') || settings.get<string>('Outlook_Calendar_Mode') !== 'server') {
		return undefined;
	}

	const providerId = settings.get<string>('Outlook_Calendar_Server_Sync_Provider');

	switch (providerId) {
		case 'graph':
			return new MicrosoftGraphProvider({
				tenantId: settings.get<string>('Outlook_Calendar_Graph_Tenant_Id'),
				clientId: settings.get<string>('Outlook_Calendar_Graph_Client_Id'),
				clientSecret: settings.get<string>('Outlook_Calendar_Graph_Client_Secret'),
				authorityHost: settings.get<string>('Outlook_Calendar_Graph_Authority_Host') || undefined,
				graphHost: settings.get<string>('Outlook_Calendar_Graph_Host') || undefined,
			});

		case 'ews':
			return new ExchangeEwsProvider(
				new NtlmEwsTransport({
					url: settings.get<string>('Outlook_Calendar_EWS_Url'),
					username: settings.get<string>('Outlook_Calendar_EWS_Username'),
					password: settings.get<string>('Outlook_Calendar_EWS_Password'),
					authMethod: settings.get<string>('Outlook_Calendar_EWS_Auth_Method') === 'basic' ? 'basic' : 'ntlm',
					caCert: settings.get<string>('Outlook_Calendar_EWS_CA_Cert') || undefined,
					rejectUnauthorized: settings.get<boolean>('Outlook_Calendar_EWS_Reject_Unauthorized') !== false,
				}),
				settings.get<string>('Outlook_Calendar_EWS_Username'),
			);

		default:
			logger.error({ msg: 'Unknown Exchange provider configured', providerId });
			return undefined;
	}
};

export const getExchangeProvider = (): IExchangeProvider => {
	if (!current) {
		throw new ExchangeError('not-configured', 'Server-to-server Exchange sync is not configured');
	}

	return current;
};

const DEFAULT_SYNC_WINDOW_HOURS = 48;
const MIN_SYNC_WINDOW_HOURS = 1;
// 30 days. Wider than this, a daily series expands past the item cap `CalendarView` requests
const MAX_SYNC_WINDOW_HOURS = 720;

/**
 * The start is floored to this, so every run inside the same step asks for the identical window. That is
 * what keeps a Graph delta link usable
 */
export const SYNC_WINDOW_ANCHOR_MS = 60 * 60 * 1000;

/**
 * Anchored rather than starting at `now`, and one anchor step wider so the end is never closer than the
 * configured hours.
 */
export const getSyncWindow = (from: Date = new Date()): DateRange => {
	const configured = Math.trunc(settings.get<number>('Outlook_Calendar_Server_Sync_Window_Hours')) || DEFAULT_SYNC_WINDOW_HOURS;
	const hours = Math.min(Math.max(configured, MIN_SYNC_WINDOW_HOURS), MAX_SYNC_WINDOW_HOURS);

	const start = new Date(Math.floor(from.getTime() / SYNC_WINDOW_ANCHOR_MS) * SYNC_WINDOW_ANCHOR_MS);

	return { start, end: new Date(start.getTime() + hours * 60 * 60 * 1000 + SYNC_WINDOW_ANCHOR_MS) };
};

export const isServerSyncEnabled = (): boolean => current !== undefined;

export const registerExchangeProviderWatchers = () =>
	settings.watchMultiple(WATCHED_SETTINGS, () => {
		try {
			current = buildExchangeProvider();
		} catch (err) {
			// Fail silently
			current = undefined;
			logger.error({ msg: 'Could not build the Exchange provider from the current settings', err: scrubForLog(err) });
		}

		logger.debug({ msg: 'Exchange provider rebuilt', provider: current?.id ?? 'none' });
	});

/** Without this a license downgrade leaves a live, credentialed provider behind. */
export const detachExchangeProvider = (): void => {
	current = undefined;
};
