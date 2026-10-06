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

const MAILBOX = 'user@contoso.com';
const ACCESS_TOKEN = 'the-token';

const tokenResponse = {
	ok: true,
	status: 200,
	headers: { get: () => null },
	json: async () => ({ access_token: ACCESS_TOKEN, expires_in: 3600 }),
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
		const EVENT_ID = 'AAMkAD';
		const NEXT_LINK = 'https://graph.microsoft.com/page2';
		const DELTA_LINK = 'https://graph.microsoft.com/delta';

		it('requests calendarView/delta scoped to the window, in UTC', async () => {
			mockTokenThen(graphResponse({ value: [] }));

			await new MicrosoftGraphProvider(config).listEvents(MAILBOX, timeWindow);

			const [url, options] = graphCall();
			expect(url).toContain(`/v1.0/users/${encodeURIComponent(MAILBOX)}/calendarView/delta`);
			expect(url).toContain(`startDateTime=${encodeURIComponent(timeWindow.start.toISOString())}`);
			expect(url).toContain(`endDateTime=${encodeURIComponent(timeWindow.end.toISOString())}`);
			expect(options.headers.Prefer).toBe('outlook.timezone="UTC"');
			expect(options.headers.Authorization).toBe(`Bearer ${ACCESS_TOKEN}`);
		});

		it('follows a cursor verbatim instead of rebuilding the query', async () => {
			const cursor = 'https://graph.microsoft.com/v1.0/users/u/calendarView/delta?$deltatoken=abc';

			mockTokenThen(graphResponse({ value: [] }));

			await new MicrosoftGraphProvider(config).listEvents(MAILBOX, timeWindow, cursor);

			expect(graphCall()[0]).toBe(cursor);
		});

		it('maps a Graph event onto the normalized shape', async () => {
			const SUBJECT = 'Sprint review';
			const DESCRIPTION = 'Agenda here';
			const MEETING_URL = 'https://teams.example/meet';
			const REMINDER_MINUTES = 15;
			// Graph sends the local time with seven decimals and no zone; UTC is what we asked for through `Prefer`.
			const STARTS_AT = '2026-08-21T10:00:00';
			const ENDS_AT = '2026-08-21T11:00:00';

			mockTokenThen(
				graphResponse({
					value: [
						{
							id: EVENT_ID,
							subject: SUBJECT,
							body: { content: DESCRIPTION },
							start: { dateTime: `${STARTS_AT}.0000000`, timeZone: 'UTC' },
							end: { dateTime: `${ENDS_AT}.0000000`, timeZone: 'UTC' },
							isCancelled: false,
							showAs: 'busy',
							onlineMeeting: { joinUrl: MEETING_URL },
							reminderMinutesBeforeStart: REMINDER_MINUTES,
						},
					],
				}),
			);

			const page = await new MicrosoftGraphProvider(config).listEvents(MAILBOX, timeWindow);

			expect(page.items).toHaveLength(1);
			expect(page.items[0]).toEqual({
				kind: 'upsert',
				externalId: EVENT_ID,
				subject: SUBJECT,
				description: DESCRIPTION,
				startTime: new Date(`${STARTS_AT}Z`),
				endTime: new Date(`${ENDS_AT}Z`),
				isCancelled: false,
				busy: true,
				meetingUrl: MEETING_URL,
				reminderMinutesBeforeStart: REMINDER_MINUTES,
			});
		});

		it('maps a removed event to a deletion', async () => {
			mockTokenThen(graphResponse({ value: [{ 'id': EVENT_ID, '@removed': { reason: 'deleted' } }] }));

			const page = await new MicrosoftGraphProvider(config).listEvents(MAILBOX, timeWindow);

			expect(page.items[0]).toEqual({ kind: 'deleted', externalId: EVENT_ID });
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

			const page = await new MicrosoftGraphProvider(config).listEvents(MAILBOX, timeWindow);

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

			const page = await new MicrosoftGraphProvider(config).listEvents(MAILBOX, timeWindow);

			expect(page.items).toHaveLength(1);
			expect(page.items[0].externalId).toBe('z');
		});

		it('hands an unfinished round back as the cursor, so the caller resumes it rather than reopening it', async () => {
			mockTokenThen(
				graphResponse({
					'value': [{ id: 'a', start: { dateTime: '2026-08-21T10:00:00' } }],
					'@odata.nextLink': NEXT_LINK,
				}),
			);

			const page = await new MicrosoftGraphProvider(config).listEvents(MAILBOX, timeWindow);

			expect(page.items.map(({ externalId }) => externalId)).toEqual(['a']);
			expect(page).toMatchObject({ cursor: NEXT_LINK, hasMore: true });
		});

		it('resumes from the nextLink it was given instead of opening a new delta', async () => {
			mockTokenThen(graphResponse({ 'value': [], '@odata.deltaLink': DELTA_LINK }));

			await new MicrosoftGraphProvider(config).listEvents(MAILBOX, timeWindow, NEXT_LINK);

			expect(serverFetch.mock.calls[1][0]).toBe(NEXT_LINK);
		});

		it('never claims a page is full window: Graph only ever answers with what changed', async () => {
			mockTokenThen(graphResponse({ 'value': [], '@odata.deltaLink': DELTA_LINK }));

			const page = await new MicrosoftGraphProvider(config).listEvents(MAILBOX, timeWindow);

			expect(page).toMatchObject({ coverage: 'delta', hasMore: false, cursor: DELTA_LINK });
		});
	});

	describe('error mapping', () => {
		it.each([
			[403, 'authorization-failed'],
			[404, 'mailbox-not-found'],
			[400, 'unexpected-response'],
		])('maps %i to %s', async (status, code) => {
			mockTokenThen(graphResponse({ error: {} }, status));

			await expect(new MicrosoftGraphProvider(config).listEvents(MAILBOX, timeWindow)).rejects.toMatchObject({ code });
		});

		it('drops a stale token and retries once on 401, then succeeds', async () => {
			mockTokenThen(graphResponse({ error: {} }, 401), tokenResponse, graphResponse({ value: [] }));

			const page = await new MicrosoftGraphProvider(config).listEvents(MAILBOX, timeWindow);

			expect(page.items).toEqual([]);
			// token, rejected call, fresh token, retried call
			expect(serverFetch).toHaveBeenCalledTimes(4);
		});

		it('gives up with authentication-failed when the retry is also rejected', async () => {
			mockTokenThen(graphResponse({ error: {} }, 401), tokenResponse, graphResponse({ error: {} }, 401));

			await expect(new MicrosoftGraphProvider(config).listEvents(MAILBOX, timeWindow)).rejects.toMatchObject({
				code: 'authentication-failed',
			});
		});
	});
});
