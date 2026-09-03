import { MicrosoftGraphProvider, parseGraphDateTime } from './MicrosoftGraphProvider';
import type { ExchangeEventUpsert } from '../definition/types';

const serverFetch = jest.fn();

jest.mock('@rocket.chat/server-fetch', () => ({
	serverFetch: (...args: unknown[]) => serverFetch(...args),
}));

const config = {
	tenantId: 'contoso.onmicrosoft.com',
	clientId: 'client-id',
	clientSecret: 'client-secret',
};

const tokenResponse = {
	ok: true,
	status: 200,
	headers: { get: () => null },
	json: async () => ({ access_token: 'the-token', expires_in: 3600 }),
	text: async () => '',
};

const graphResponse = (payload: unknown, status = 200) => ({
	ok: status >= 200 && status < 300,
	status,
	headers: { get: () => null },
	json: async () => payload,
	text: async () => JSON.stringify(payload),
});

const timeWindow = { start: new Date('2026-08-21T00:00:00Z'), end: new Date('2026-08-22T00:00:00Z') };

// Token request first, then the Graph call
const mockTokenThen = (...responses: unknown[]) => {
	serverFetch.mockResolvedValueOnce(tokenResponse);
	responses.forEach((r) => serverFetch.mockResolvedValueOnce(r));
};

const graphCall = () => serverFetch.mock.calls[1];

describe('parseGraphDateTime', () => {
	it('treats a zone-less Graph timestamp as UTC, since we always request UTC', () => {
		expect(parseGraphDateTime({ dateTime: '2026-08-21T10:00:00.0000000', timeZone: 'UTC' })?.toISOString()).toBe(
			'2026-08-21T10:00:00.000Z',
		);
	});

	it('respects an explicit offset when one is present', () => {
		expect(parseGraphDateTime({ dateTime: '2026-08-21T10:00:00+02:00' })?.toISOString()).toBe('2026-08-21T08:00:00.000Z');
	});

	it('returns undefined for missing or unparseable values', () => {
		expect(parseGraphDateTime(undefined)).toBeUndefined();
		expect(parseGraphDateTime({})).toBeUndefined();
		expect(parseGraphDateTime({ dateTime: 'not-a-date' })).toBeUndefined();
	});
});

describe('MicrosoftGraphProvider', () => {
	beforeEach(() => serverFetch.mockReset());

	describe('testConnection', () => {
		it('succeeds when the credentials produce a token', async () => {
			serverFetch.mockResolvedValue(tokenResponse);

			await expect(new MicrosoftGraphProvider(config).testConnection()).resolves.toBeUndefined();
		});

		it('fails when the credentials are rejected', async () => {
			serverFetch.mockResolvedValue(graphResponse({ error: 'invalid_client' }, 401));

			await expect(new MicrosoftGraphProvider(config).testConnection()).rejects.toMatchObject({
				code: 'authentication-failed',
			});
		});
	});

	describe('listEvents', () => {
		it('requests calendarView/delta scoped to the window, in UTC', async () => {
			mockTokenThen(graphResponse({ value: [] }));

			await new MicrosoftGraphProvider(config).listEvents('user@contoso.com', timeWindow);

			const [url, options] = graphCall();
			expect(url).toContain('/v1.0/users/user%40contoso.com/calendarView/delta');
			expect(url).toContain('startDateTime=2026-08-21T00%3A00%3A00.000Z');
			expect(url).toContain('endDateTime=2026-08-22T00%3A00%3A00.000Z');
			expect(options.headers.Prefer).toBe('outlook.timezone="UTC"');
			expect(options.headers.Authorization).toBe('Bearer the-token');
		});

		it('follows a cursor verbatim instead of rebuilding the query', async () => {
			mockTokenThen(graphResponse({ value: [] }));

			const cursor = 'https://graph.microsoft.com/v1.0/users/u/calendarView/delta?$deltatoken=abc';
			await new MicrosoftGraphProvider(config).listEvents('user@contoso.com', timeWindow, cursor);

			expect(graphCall()[0]).toBe(cursor);
		});

		it('maps a Graph event onto the normalized shape', async () => {
			mockTokenThen(
				graphResponse({
					value: [
						{
							id: 'AAMkAD',
							iCalUId: '040000008200E0',
							subject: 'Sprint review',
							body: { content: 'Agenda here' },
							start: { dateTime: '2026-08-21T10:00:00.0000000', timeZone: 'UTC' },
							end: { dateTime: '2026-08-21T11:00:00.0000000', timeZone: 'UTC' },
							isAllDay: false,
							isCancelled: false,
							showAs: 'busy',
							onlineMeeting: { joinUrl: 'https://teams.example/meet' },
							reminderMinutesBeforeStart: 15,
						},
					],
				}),
			);

			const page = await new MicrosoftGraphProvider(config).listEvents('user@contoso.com', timeWindow);

			expect(page.items).toHaveLength(1);
			expect(page.items[0]).toEqual({
				kind: 'upsert',
				externalId: 'AAMkAD',
				iCalUId: '040000008200E0',
				subject: 'Sprint review',
				description: 'Agenda here',
				startTime: new Date('2026-08-21T10:00:00Z'),
				endTime: new Date('2026-08-21T11:00:00Z'),
				isAllDay: false,
				isCancelled: false,
				busy: true,
				meetingUrl: 'https://teams.example/meet',
				reminderMinutesBeforeStart: 15,
			});
		});

		it('maps a removed event to a deletion', async () => {
			mockTokenThen(graphResponse({ value: [{ 'id': 'AAMkAD', '@removed': { reason: 'deleted' } }] }));

			const page = await new MicrosoftGraphProvider(config).listEvents('user@contoso.com', timeWindow);

			expect(page.items[0]).toEqual({ kind: 'deleted', externalId: 'AAMkAD' });
		});

		it.each([
			['free', false],
			['tentative', false],
			['oof', false],
			['busy', true],
		])('treats showAs %s as busy=%s, matching the EWS behaviour', async (showAs, expected) => {
			mockTokenThen(
				graphResponse({
					value: [{ id: 'x', start: { dateTime: '2026-08-21T10:00:00.0000000' }, showAs }],
				}),
			);

			const page = await new MicrosoftGraphProvider(config).listEvents('user@contoso.com', timeWindow);

			expect((page.items[0] as ExchangeEventUpsert).busy).toBe(expected);
		});

		it('skips events that have no id or no parseable start', async () => {
			mockTokenThen(
				graphResponse({
					value: [
						{ subject: 'no id' },
						{ id: 'y', start: { dateTime: 'garbage' } },
						{ id: 'z', start: { dateTime: '2026-08-21T10:00:00' } },
					],
				}),
			);

			const page = await new MicrosoftGraphProvider(config).listEvents('user@contoso.com', timeWindow);

			expect(page.items).toHaveLength(1);
			expect(page.items[0].externalId).toBe('z');
		});

		it('walks the nextLink pages itself so one call is one whole answer', async () => {
			mockTokenThen(
				graphResponse({
					'value': [{ id: 'a', start: { dateTime: '2026-08-21T10:00:00' } }],
					'@odata.nextLink': 'https://graph.microsoft.com/page2',
				}),
				graphResponse({
					'value': [{ id: 'b', start: { dateTime: '2026-08-21T11:00:00' } }],
					'@odata.deltaLink': 'https://graph.microsoft.com/delta',
				}),
			);

			const page = await new MicrosoftGraphProvider(config).listEvents('user@contoso.com', timeWindow);

			expect(serverFetch.mock.calls[2][0]).toBe('https://graph.microsoft.com/page2');
			expect(page.items.map(({ externalId }) => externalId)).toEqual(['a', 'b']);
			expect(page).toMatchObject({ cursor: 'https://graph.microsoft.com/delta', hasMore: false });
		});

		it('calls a no-cursor read complete for the window, which is what lets the caller prune', async () => {
			mockTokenThen(graphResponse({ 'value': [], '@odata.deltaLink': 'https://graph.microsoft.com/delta' }));

			const page = await new MicrosoftGraphProvider(config).listEvents('user@contoso.com', timeWindow);

			expect(page.isCompleteForWindow).toBe(true);
		});

		it('never calls a resumed delta complete: it carries changes, not the window', async () => {
			mockTokenThen(graphResponse({ 'value': [], '@odata.deltaLink': 'https://graph.microsoft.com/delta' }));

			const page = await new MicrosoftGraphProvider(config).listEvents(
				'user@contoso.com',
				timeWindow,
				'https://graph.microsoft.com/v1.0/users/u/calendarView/delta?$deltatoken=abc',
			);

			expect(page.isCompleteForWindow).toBe(false);
		});
	});

	describe('error mapping', () => {
		it.each([
			[403, 'authorization-failed'],
			[404, 'mailbox-not-found'],
			[400, 'unexpected-response'],
		])('maps %i to %s', async (status, code) => {
			mockTokenThen(graphResponse({ error: {} }, status));

			await expect(new MicrosoftGraphProvider(config).listEvents('user@contoso.com', timeWindow)).rejects.toMatchObject({ code });
		});

		it('drops a stale token and retries once on 401, then succeeds', async () => {
			mockTokenThen(graphResponse({ error: {} }, 401), tokenResponse, graphResponse({ value: [] }));

			const page = await new MicrosoftGraphProvider(config).listEvents('user@contoso.com', timeWindow);

			expect(page.items).toEqual([]);
			// token, rejected call, fresh token, retried call
			expect(serverFetch).toHaveBeenCalledTimes(4);
		});

		it('gives up with authentication-failed when the retry is also rejected', async () => {
			mockTokenThen(graphResponse({ error: {} }, 401), tokenResponse, graphResponse({ error: {} }, 401));

			await expect(new MicrosoftGraphProvider(config).listEvents('user@contoso.com', timeWindow)).rejects.toMatchObject({
				code: 'authentication-failed',
			});
		});
	});
});
