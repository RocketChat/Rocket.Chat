import { serverFetch } from '@rocket.chat/server-fetch';

import type { CalendarSyncFetchFn, ICalendarSyncProvider } from './definition';
import { ExchangeEwsCalendarProvider } from './providers/ews/ExchangeEwsCalendarProvider';
import { MicrosoftGraphCalendarProvider } from './providers/graph/MicrosoftGraphCalendarProvider';
import { GRAPH_CLOUDS, resolveGraphCloud } from './providers/graph/clouds';
import { settings } from '../../../../server/settings';

// The provider only ever targets the hardcoded Microsoft cloud hosts, so SSRF
// validation (meant for user-supplied URLs) does not apply — same as the Slack bridge
const fetchAdapter: CalendarSyncFetchFn = (url, options) => serverFetch(url, { ...options, ignoreSsrfValidation: true });

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
		const authMethod =
			settings.get<string>('CalendarSync_Graph_Auth_Method') === 'certificate' ? ('certificate' as const) : ('client-secret' as const);
		const clientSecret = settings.get<string>('CalendarSync_Graph_ClientSecret');
		const certificatePem = settings.get<string>('CalendarSync_Graph_Certificate');
		const privateKeyPem = settings.get<string>('CalendarSync_Graph_PrivateKey');
		const cloud = resolveGraphCloud(settings.get<string>('CalendarSync_Graph_Cloud'));

		if (!tenantId || !clientId) {
			return null;
		}
		if (authMethod === 'certificate' ? !certificatePem || !privateKeyPem : !clientSecret) {
			return null;
		}

		const key = JSON.stringify([type, tenantId, clientId, authMethod, clientSecret, certificatePem, privateKeyPem, cloud]);
		if (cached?.key !== key) {
			cached = {
				key,
				provider: new MicrosoftGraphCalendarProvider(
					{
						tenantId,
						clientId,
						authMethod,
						...(authMethod === 'certificate' ? { certificatePem, privateKeyPem } : { clientSecret }),
						...GRAPH_CLOUDS[cloud],
					},
					fetchAdapter,
				),
			};
		}
		return cached.provider;
	}

	if (type === 'exchange-ews') {
		const url = settings.get<string>('CalendarSync_Ews_Url')?.trim();
		const username = settings.get<string>('CalendarSync_Ews_Username')?.trim();
		const password = settings.get<string>('CalendarSync_Ews_Password');
		const authMethod = settings.get<string>('CalendarSync_Ews_AuthMethod') === 'basic' ? ('basic' as const) : ('ntlm' as const);

		if (!url || !username || !password) {
			return null;
		}

		const key = JSON.stringify([type, url, username, password, authMethod]);
		if (cached?.key !== key) {
			cached = {
				key,
				provider: new ExchangeEwsCalendarProvider({ url, username, password, authMethod }),
			};
		}
		return cached.provider;
	}

	return null;
}
