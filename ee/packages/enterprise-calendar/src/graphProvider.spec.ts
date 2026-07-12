import { MicrosoftGraphCalendarProvider } from './graphProvider';
import type { GraphProviderConfiguration, HttpClient } from './types';

const configuration: GraphProviderConfiguration = {
	cloud: 'global',
	tenantId: '11111111-1111-4111-8111-111111111111',
	clientId: 'client',
	credential: { type: 'client-secret', clientSecret: 'secret' },
};
const mailbox = { provider: 'microsoft-graph' as const, address: 'person@example.com' };
const response = (status: number, value?: unknown, headers: Record<string, string> = {}) => ({
	status,
	headers: { get: (name: string) => headers[name.toLowerCase()] ?? null },
	text: async () => (value === undefined ? '' : JSON.stringify(value)),
});

describe('MicrosoftGraphCalendarProvider', () => {
	it('paginates delta, normalizes privacy-safe fields, and handles tombstones', async () => {
		const http = jest
			.fn<HttpClient>()
			.mockResolvedValueOnce(response(200, { access_token: 'token', expires_in: 3600 }))
			.mockResolvedValueOnce(
				response(200, {
					'value': [
						{
							id: 'one',
							start: { dateTime: '2026-07-11T10:00:00.0000000', timeZone: 'UTC' },
							end: { dateTime: '2026-07-11T11:00:00.0000000', timeZone: 'UTC' },
							showAs: 'busy',
							sensitivity: 'private',
						},
					],
					'@odata.nextLink': 'https://graph.microsoft.com/v1.0/users/u/calendarView/delta?$skiptoken=opaque',
				}),
			)
			.mockResolvedValueOnce(
				response(200, {
					'value': [{ 'id': 'deleted', '@removed': { reason: 'deleted' } }],
					'@odata.deltaLink': 'https://graph.microsoft.com/v1.0/users/u/calendarView/delta?$deltatoken=opaque',
				}),
			);
		const provider = new MicrosoftGraphCalendarProvider(configuration, http);
		const result = await provider.getInitialDelta(mailbox, new Date('2026-07-11T00:00:00Z'), new Date('2026-07-12T00:00:00Z'));
		expect(result.events).toHaveLength(1);
		expect(result.events[0]).toMatchObject({ externalId: 'one', availability: 'busy', isPrivate: true });
		expect(result.deletedExternalIds).toEqual(['deleted']);
		expect(result.nextCursor?.value).toContain('$deltatoken=opaque');
		const graphRequest = http.mock.calls[1][1];
		expect(graphRequest.headers?.Authorization).toBe('Bearer token');
		expect(http.mock.calls[1][0]).not.toContain('subject');
	});

	it('rejects an attacker-controlled delta URL without making a request', async () => {
		const http = jest.fn<HttpClient>();
		const provider = new MicrosoftGraphCalendarProvider(configuration, http);
		await expect(
			provider.synchronizeChanges(mailbox, {
				value: 'https://169.254.169.254/latest/meta-data',
				windowStart: new Date('2026-07-11T00:00:00Z'),
				windowEnd: new Date('2026-07-12T00:00:00Z'),
			}),
		).rejects.toThrow('Untrusted Microsoft Graph cursor URL');
		expect(http).not.toHaveBeenCalled();
	});

	it('returns a full-resync signal for an expired cursor', async () => {
		const http = jest
			.fn<HttpClient>()
			.mockResolvedValueOnce(response(200, { access_token: 'token', expires_in: 3600 }))
			.mockResolvedValueOnce(response(410, { error: { code: 'SyncStateNotFound' } }));
		const provider = new MicrosoftGraphCalendarProvider(configuration, http);
		await expect(
			provider.synchronizeChanges(mailbox, {
				value: 'https://graph.microsoft.com/v1.0/users/u/calendarView/delta?$deltatoken=old',
				windowStart: new Date('2026-07-11T00:00:00Z'),
				windowEnd: new Date('2026-07-12T00:00:00Z'),
			}),
		).resolves.toMatchObject({ requiresFullResync: true });
	});

	it('classifies throttling and respects Retry-After', async () => {
		const http = jest
			.fn<HttpClient>()
			.mockResolvedValueOnce(response(200, { access_token: 'token', expires_in: 3600 }))
			.mockResolvedValueOnce(response(429, { error: { code: 'TooManyRequests' } }, { 'retry-after': '7' }));
		const provider = new MicrosoftGraphCalendarProvider(configuration, http);
		await expect(provider.getCalendarWindow(mailbox, new Date('2026-07-11'), new Date('2026-07-12'))).rejects.toMatchObject({
			category: 'throttled',
			retryable: true,
			retryAfterMs: 7_000,
		});
	});
});
