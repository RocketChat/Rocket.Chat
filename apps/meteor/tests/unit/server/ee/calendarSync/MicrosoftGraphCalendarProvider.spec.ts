import { expect } from 'chai';
import { describe, it } from 'mocha';
import sinon from 'sinon';

import { MicrosoftGraphCalendarProvider } from '../../../../../ee/server/lib/calendarSync/providers/graph/MicrosoftGraphCalendarProvider';

const CONFIG = {
	tenantId: 'tenant-1',
	clientId: 'client-1',
	clientSecret: 'secret-1',
	loginHost: 'https://login.microsoftonline.com',
	graphHost: 'https://graph.microsoft.com',
};

const WINDOW = {
	start: new Date('2026-07-11T00:00:00Z'),
	end: new Date('2026-07-18T00:00:00Z'),
};

const jsonResponse = (payload: unknown, status = 200, headers: Record<string, string> = {}) => ({
	ok: status >= 200 && status < 300,
	status,
	headers: { get: (name: string) => headers[name] ?? null },
	json: async () => payload,
	text: async () => JSON.stringify(payload),
});

const TOKEN_PAYLOAD = { access_token: 'tok-1', expires_in: 3600, token_type: 'Bearer' };

const isTokenUrl = (url: string) => url.includes('/oauth2/v2.0/token');

const graphEvent = (id: string, overrides: Record<string, unknown> = {}) => ({
	id,
	iCalUId: `ical-${id}`,
	subject: `Meeting ${id}`,
	bodyPreview: `Agenda for ${id}`,
	start: { dateTime: '2026-07-12T10:00:00.0000000', timeZone: 'UTC' },
	end: { dateTime: '2026-07-12T11:00:00.0000000', timeZone: 'UTC' },
	showAs: 'busy',
	isCancelled: false,
	...overrides,
});

/** Routes the token endpoint automatically and serves graph pages in order */
const makeFetch = (pages: ((url: string, options: any) => any)[]) => {
	let call = 0;
	const graphCalls: { url: string; options: any }[] = [];
	const fetchFn = sinon.stub().callsFake(async (url: string, options: any) => {
		if (isTokenUrl(url)) {
			return jsonResponse(TOKEN_PAYLOAD);
		}
		graphCalls.push({ url, options });
		const page = pages[Math.min(call, pages.length - 1)];
		call++;
		return page(url, options);
	});
	return { fetchFn, graphCalls };
};

const noSleep = async () => undefined;

describe('calendarSync/MicrosoftGraphCalendarProvider', () => {
	describe('listEvents', () => {
		it('should perform a full window sync, follow nextLink pages and extract the delta token', async () => {
			const { fetchFn, graphCalls } = makeFetch([
				() =>
					jsonResponse({
						'value': [graphEvent('e1')],
						'@odata.nextLink': 'https://graph.microsoft.com/v1.0/users/u/calendarView/delta?$skiptoken=abc',
					}),
				() =>
					jsonResponse({
						'value': [graphEvent('e2', { showAs: 'free' })],
						'@odata.deltaLink': 'https://graph.microsoft.com/v1.0/users/u/calendarView/delta?$deltatoken=delta-123',
					}),
			]);
			const provider = new MicrosoftGraphCalendarProvider(CONFIG, fetchFn, noSleep);

			const result = await provider.listEvents('user@example.com', WINDOW);

			expect(result.full).to.be.true;
			expect(result.nextDeltaToken).to.equal('delta-123');
			expect(result.deletedEventIds).to.deep.equal([]);
			expect(result.events).to.have.length(2);

			const [first, second] = result.events;
			expect(first.externalId).to.equal('e1');
			expect(first.iCalUId).to.equal('ical-e1');
			expect(first.subject).to.equal('Meeting e1');
			expect(first.description).to.equal('Agenda for e1');
			expect(first.busy).to.be.true;
			expect(first.startTime.toISOString()).to.equal('2026-07-12T10:00:00.000Z');
			expect(second.busy).to.be.false;

			// First call carries the window; second follows the nextLink verbatim
			expect(graphCalls[0].url).to.include('/users/user%40example.com/calendarView/delta');
			expect(graphCalls[0].url).to.include('startDateTime=2026-07-11T00%3A00%3A00.000Z');
			expect(graphCalls[1].url).to.include('$skiptoken=abc');
			expect(graphCalls[0].options.headers.Authorization).to.equal('Bearer tok-1');
		});

		it('should resume from a delta token and surface removed events', async () => {
			const { fetchFn, graphCalls } = makeFetch([
				() =>
					jsonResponse({
						'value': [graphEvent('e1'), { '@removed': { reason: 'deleted' }, 'id': 'e-gone' }],
						'@odata.deltaLink': 'https://graph.microsoft.com/v1.0/users/u/calendarView/delta?$deltatoken=delta-next',
					}),
			]);
			const provider = new MicrosoftGraphCalendarProvider(CONFIG, fetchFn, noSleep);

			const result = await provider.listEvents('user@example.com', WINDOW, 'delta-prev');

			expect(result.full).to.be.false;
			expect(result.deletedEventIds).to.deep.equal(['e-gone']);
			expect(result.events.map((e) => e.externalId)).to.deep.equal(['e1']);
			expect(result.nextDeltaToken).to.equal('delta-next');
			expect(graphCalls[0].url).to.include('$deltatoken=delta-prev');
		});

		it('should restart with a full sync when the delta token is rejected with 410', async () => {
			let served410 = false;
			const { fetchFn, graphCalls } = makeFetch([
				(url: string) => {
					if (url.includes('$deltatoken=stale') && !served410) {
						served410 = true;
						return jsonResponse({ error: { code: 'SyncStateNotFound' } }, 410);
					}
					return jsonResponse({
						'value': [graphEvent('e1')],
						'@odata.deltaLink': 'https://graph.microsoft.com/v1.0/users/u/calendarView/delta?$deltatoken=fresh',
					});
				},
			]);
			const provider = new MicrosoftGraphCalendarProvider(CONFIG, fetchFn, noSleep);

			const result = await provider.listEvents('user@example.com', WINDOW, 'stale');

			expect(result.full).to.be.true;
			expect(result.nextDeltaToken).to.equal('fresh');
			expect(graphCalls[1].url).to.include('startDateTime=');
		});

		it('should honor Retry-After on 429 and then succeed', async () => {
			const sleeps: number[] = [];
			const sleep = async (ms: number) => {
				sleeps.push(ms);
			};
			let throttled = false;
			const { fetchFn } = makeFetch([
				() => {
					if (!throttled) {
						throttled = true;
						return jsonResponse({ error: { code: 'TooManyRequests' } }, 429, { 'Retry-After': '7' });
					}
					return jsonResponse({
						'value': [graphEvent('e1')],
						'@odata.deltaLink': 'https://graph.microsoft.com/v1.0/users/u/calendarView/delta?$deltatoken=d',
					});
				},
			]);
			const provider = new MicrosoftGraphCalendarProvider(CONFIG, fetchFn, sleep);

			const result = await provider.listEvents('user@example.com', WINDOW);

			expect(sleeps).to.deep.equal([7000]);
			expect(result.events).to.have.length(1);
		});

		it('should give up with a throttled error after exhausting retries', async () => {
			const { fetchFn } = makeFetch([() => jsonResponse({ error: { code: 'TooManyRequests' } }, 429, { 'Retry-After': '1' })]);
			const provider = new MicrosoftGraphCalendarProvider(CONFIG, fetchFn, noSleep);

			await provider.listEvents('user@example.com', WINDOW).then(
				() => expect.fail('expected rejection'),
				(error) => expect(error.code).to.equal('throttled'),
			);
		});

		it('should refuse pagination links pointing outside the configured graph host', async () => {
			const { fetchFn } = makeFetch([
				() =>
					jsonResponse({
						'value': [],
						'@odata.nextLink': 'https://evil.example.com/v1.0/whatever',
					}),
			]);
			const provider = new MicrosoftGraphCalendarProvider(CONFIG, fetchFn, noSleep);

			await provider.listEvents('user@example.com', WINDOW).then(
				() => expect.fail('expected rejection'),
				(error) => expect(error.code).to.equal('provider-error'),
			);
		});

		it('should map 403 responses to consent-missing', async () => {
			const { fetchFn } = makeFetch([() => jsonResponse({ error: { code: 'Authorization_RequestDenied', message: 'denied' } }, 403)]);
			const provider = new MicrosoftGraphCalendarProvider(CONFIG, fetchFn, noSleep);

			await provider.listEvents('user@example.com', WINDOW).then(
				() => expect.fail('expected rejection'),
				(error) => expect(error.code).to.equal('consent-missing'),
			);
		});

		it('should map 404 responses to mailbox-not-found', async () => {
			const { fetchFn } = makeFetch([() => jsonResponse({ error: { code: 'ErrorItemNotFound', message: 'no mailbox' } }, 404)]);
			const provider = new MicrosoftGraphCalendarProvider(CONFIG, fetchFn, noSleep);

			await provider.listEvents('user@example.com', WINDOW).then(
				() => expect.fail('expected rejection'),
				(error) => expect(error.code).to.equal('mailbox-not-found'),
			);
		});
	});

	describe('getFreeBusy', () => {
		it('should post the mailboxes to getSchedule and map busy intervals', async () => {
			const { fetchFn, graphCalls } = makeFetch([
				() =>
					jsonResponse({
						value: [
							{
								scheduleId: 'a@example.com',
								scheduleItems: [
									{ status: 'busy', start: { dateTime: '2026-07-11T10:00:00.0000000' }, end: { dateTime: '2026-07-11T11:00:00.0000000' } },
									{ status: 'free', start: { dateTime: '2026-07-11T11:00:00.0000000' }, end: { dateTime: '2026-07-11T12:00:00.0000000' } },
									{ status: 'oof', start: { dateTime: '2026-07-11T13:00:00.0000000' }, end: { dateTime: '2026-07-11T14:00:00.0000000' } },
								],
							},
							{ scheduleId: 'b@example.com', error: { message: 'Mailbox not found' } },
						],
					}),
			]);
			const provider = new MicrosoftGraphCalendarProvider(CONFIG, fetchFn, noSleep);

			const results = await provider.getFreeBusy(['a@example.com', 'b@example.com'], WINDOW);

			expect(graphCalls[0].url).to.include('/users/a%40example.com/calendar/getSchedule');
			const body = JSON.parse(graphCalls[0].options.body);
			expect(body.schedules).to.deep.equal(['a@example.com', 'b@example.com']);

			expect(results).to.have.length(2);
			expect(results[0].intervals).to.have.length(2);
			expect(results[0].intervals[0].status).to.equal('busy');
			expect(results[0].intervals[1].status).to.equal('oof');
			expect(results[1].error).to.exist;
			expect(results[1].intervals).to.be.empty;
		});
	});

	describe('subscriptions', () => {
		it('should create a change-notification subscription for the mailbox events resource', async () => {
			const { fetchFn, graphCalls } = makeFetch([() => jsonResponse({ id: 'sub-1', expirationDateTime: '2026-07-14T10:00:00.0000000Z' })]);
			const provider = new MicrosoftGraphCalendarProvider(CONFIG, fetchFn, noSleep);

			const subscription = await provider.createSubscription(
				'user@example.com',
				'https://chat.example.com/api/v1/calendar-sync.webhook',
				'secret',
			);

			expect(subscription.id).to.equal('sub-1');
			expect(subscription.expiresAt.toISOString()).to.equal('2026-07-14T10:00:00.000Z');

			expect(graphCalls[0].url).to.equal('https://graph.microsoft.com/v1.0/subscriptions');
			const body = JSON.parse(graphCalls[0].options.body);
			expect(body.changeType).to.equal('created,updated,deleted');
			expect(body.resource).to.equal('/users/user@example.com/events');
			expect(body.notificationUrl).to.equal('https://chat.example.com/api/v1/calendar-sync.webhook');
			expect(body.clientState).to.equal('secret');
			expect(body.expirationDateTime).to.be.a('string');
		});

		it('should renew subscriptions with a PATCH carrying a new expiry', async () => {
			const { fetchFn, graphCalls } = makeFetch([() => jsonResponse({ id: 'sub-1', expirationDateTime: '2026-07-14T10:00:00.0000000Z' })]);
			const provider = new MicrosoftGraphCalendarProvider(CONFIG, fetchFn, noSleep);

			const renewed = await provider.renewSubscription('sub-1');

			expect(renewed.id).to.equal('sub-1');
			expect(graphCalls[0].url).to.equal('https://graph.microsoft.com/v1.0/subscriptions/sub-1');
			expect(graphCalls[0].options.method).to.equal('PATCH');
			expect(JSON.parse(graphCalls[0].options.body)).to.have.property('expirationDateTime');
		});
	});

	describe('testConnection', () => {
		it('should succeed when a token can be acquired', async () => {
			const fetchFn = sinon.stub().callsFake(async (url: string) => {
				expect(isTokenUrl(url)).to.be.true;
				return jsonResponse(TOKEN_PAYLOAD);
			});
			const provider = new MicrosoftGraphCalendarProvider(CONFIG, fetchFn, noSleep);

			expect(await provider.testConnection()).to.deep.equal({ ok: true });
		});

		it('should probe the mailbox when one is provided and report actionable errors', async () => {
			const { fetchFn } = makeFetch([() => jsonResponse({ error: { code: 'Authorization_RequestDenied', message: 'denied' } }, 403)]);
			const provider = new MicrosoftGraphCalendarProvider(CONFIG, fetchFn, noSleep);

			const result = await provider.testConnection('probe@example.com');
			expect(result.ok).to.be.false;
			expect(result.error?.code).to.equal('consent-missing');
		});

		it('should report token failures without throwing', async () => {
			const fetchFn = sinon
				.stub()
				.resolves(jsonResponse({ error: 'invalid_request', error_description: 'AADSTS90002: Tenant not found' }, 400));
			const provider = new MicrosoftGraphCalendarProvider(CONFIG, fetchFn, noSleep);

			const result = await provider.testConnection();
			expect(result.ok).to.be.false;
			expect(result.error?.code).to.equal('invalid-tenant');
		});
	});
});
