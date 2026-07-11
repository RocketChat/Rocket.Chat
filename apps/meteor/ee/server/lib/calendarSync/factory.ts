import { serverFetch } from '@rocket.chat/server-fetch';

import { settings } from '../../../app/settings/server';
import type { CalendarSyncFetchFn, ICalendarSyncProvider } from './definition';
import { MicrosoftGraphCalendarProvider } from './providers/graph/MicrosoftGraphCalendarProvider';

// Commercial-cloud endpoints; national clouds (GCC High/DoD) become configurable in a follow-up phase
const MICROSOFT_LOGIN_HOST = 'https://login.microsoftonline.com';
const MICROSOFT_GRAPH_HOST = 'https://graph.microsoft.com';

const fetchAdapter: CalendarSyncFetchFn = (url, options) => serverFetch(url, options);

let cached: { key: string; provider: ICalendarSyncProvider } | null = null;

/**
 * Builds (and caches) the sync provider for the current settings. The cache keeps
 * the Graph token cache warm across sync runs; it is invalidated whenever any of
 * the credential settings change. Returns null when no provider is configured —
 * note the Microsoft Graph provider is only ever instantiated when explicitly
 * selected, so no Microsoft-cloud endpoint is ever contacted otherwise (air-gap
 * requirement for on-prem EWS deployments).
 */
export function getConfiguredProvider(): ICalendarSyncProvider | null {
	const type = settings.get<string>('CalendarSync_Provider');

	if (type === 'microsoft-graph') {
		const tenantId = settings.get<string>('CalendarSync_Graph_TenantId')?.trim();
		const clientId = settings.get<string>('CalendarSync_Graph_ClientId')?.trim();
		const clientSecret = settings.get<string>('CalendarSync_Graph_ClientSecret');

		if (!tenantId || !clientId || !clientSecret) {
			return null;
		}

		const key = JSON.stringify([type, tenantId, clientId, clientSecret]);
		if (cached?.key !== key) {
			cached = {
				key,
				provider: new MicrosoftGraphCalendarProvider(
					{
						tenantId,
						clientId,
						clientSecret,
						loginHost: MICROSOFT_LOGIN_HOST,
						graphHost: MICROSOFT_GRAPH_HOST,
					},
					fetchAdapter,
				),
			};
		}
		return cached.provider;
	}

	// 'exchange-ews' is implemented in a follow-up phase
	return null;
}
