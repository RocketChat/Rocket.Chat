import { expect } from 'chai';
import { describe, it, beforeEach } from 'mocha';
import proxyquire from 'proxyquire';
import sinon from 'sinon';

const calendarImportStub = sinon.stub();
const calendarDeleteStub = sinon.stub();
const usersFindStub = sinon.stub();
const usersFindOneByIdStub = sinon.stub();
const setSubscriptionStub = sinon.stub();
const findOneByExternalIdAndUserIdStub = sinon.stub();
const findServerSyncedStub = sinon.stub();
const syncStateFindOneStub = sinon.stub();
const recordSuccessStub = sinon.stub();
const recordFailureStub = sinon.stub();
const setActiveStateStub = sinon.stub();
const endActiveStateStub = sinon.stub();

const { CalendarSyncEngine, computeBusyUntil } = proxyquire
	.noCallThru()
	.load('../../../../../ee/server/lib/calendarSync/CalendarSyncEngine.ts', {
		'@rocket.chat/core-services': {
			Calendar: {
				import: calendarImportStub,
				delete: calendarDeleteStub,
			},
			Presence: {
				setActiveState: setActiveStateStub,
				endActiveState: endActiveStateStub,
			},
		},
		'@rocket.chat/models': {
			Users: { find: usersFindStub, findOneById: usersFindOneByIdStub },
			CalendarEvent: {
				findOneByExternalIdAndUserId: findOneByExternalIdAndUserIdStub,
				findServerSyncedByUserIdBetweenDates: findServerSyncedStub,
			},
			CalendarSyncState: {
				findOneByUserId: syncStateFindOneStub,
				recordSuccess: recordSuccessStub,
				recordFailure: recordFailureStub,
				setSubscription: setSubscriptionStub,
			},
		},
		'../../../../server/lib/i18n': {
			i18n: { t: (key: string) => key },
		},
	});

const silentLogger = {
	debug: () => undefined,
	info: () => undefined,
	warn: () => undefined,
	error: () => undefined,
};

const DEFAULT_CONFIG = {
	mode: 'full-events' as 'full-events' | 'free-busy-only',
	windowDays: 7,
	batchSize: 10,
	presenceEnabled: true,
	mailboxSource: 'email' as const,
	mailboxCustomField: '',
	defaultLanguage: 'en',
	roles: [] as string[],
	webhooksEnabled: false,
	webhookUrl: '',
};

const user = (id: string, email = `${id}@example.com`) => ({
	_id: id,
	username: id,
	emails: [{ address: email, verified: true }],
});

const externalEvent = (externalId: string, overrides: Record<string, unknown> = {}) => ({
	externalId,
	iCalUId: `ical-${externalId}`,
	subject: `Meeting ${externalId}`,
	description: 'agenda',
	startTime: new Date('2026-07-12T10:00:00Z'),
	endTime: new Date('2026-07-12T11:00:00Z'),
	busy: true,
	...overrides,
});

const makeProvider = (overrides: Record<string, unknown> = {}): any => ({
	type: 'microsoft-graph',
	supportsDelta: true,
	supportsWebhooks: false,
	testConnection: sinon.stub().resolves({ ok: true }),
	getFreeBusy: sinon.stub().resolves([]),
	listEvents: sinon.stub().resolves({ events: [], deletedEventIds: [], full: true }),
	...overrides,
});

const makeEngine = (provider: any, config: Partial<typeof DEFAULT_CONFIG> = {}) =>
	new CalendarSyncEngine(
		() => provider,
		() => ({ ...DEFAULT_CONFIG, ...config }),
		silentLogger,
	);

describe('calendarSync/CalendarSyncEngine', () => {
	beforeEach(() => {
		calendarImportStub.reset();
		calendarImportStub.resolves('event-id');
		calendarDeleteStub.reset();
		calendarDeleteStub.resolves({ deletedCount: 1 });
		usersFindStub.reset();
		findOneByExternalIdAndUserIdStub.reset();
		findOneByExternalIdAndUserIdStub.resolves(null);
		findServerSyncedStub.reset();
		findServerSyncedStub.returns([]);
		syncStateFindOneStub.reset();
		syncStateFindOneStub.resolves(null);
		recordSuccessStub.reset();
		recordSuccessStub.resolves({});
		recordFailureStub.reset();
		recordFailureStub.resolves({});
		setActiveStateStub.reset();
		setActiveStateStub.resolves(true);
		endActiveStateStub.reset();
		endActiveStateStub.resolves(true);
		usersFindOneByIdStub.reset();
		usersFindOneByIdStub.resolves(null);
		setSubscriptionStub.reset();
		setSubscriptionStub.resolves({});
	});

	it('should upsert fetched events through Calendar.import with the provider discriminator', async () => {
		usersFindStub.returns([user('u1')]);
		const provider = makeProvider({
			listEvents: sinon.stub().resolves({ events: [externalEvent('e1')], deletedEventIds: [], full: true, nextDeltaToken: 'd1' }),
		});

		const summary = await makeEngine(provider).runSync();

		expect(calendarImportStub.calledOnce).to.be.true;
		const imported = calendarImportStub.firstCall.args[0];
		expect(imported).to.include({
			uid: 'u1',
			externalId: 'e1',
			subject: 'Meeting e1',
			busy: true,
			provider: 'microsoft-graph',
			iCalUId: 'ical-e1',
		});
		expect(summary?.usersProcessed).to.equal(1);
		expect(summary?.eventsUpserted).to.equal(1);

		expect(recordSuccessStub.calledOnce).to.be.true;
		expect(recordSuccessStub.firstCall.args[0]).to.equal('u1');
		expect(recordSuccessStub.firstCall.args[1].deltaToken).to.equal('d1');
	});

	it('should force busy=false on imported events when presence is disabled', async () => {
		usersFindStub.returns([user('u1')]);
		const provider = makeProvider({
			listEvents: sinon.stub().resolves({ events: [externalEvent('e1', { busy: true })], deletedEventIds: [], full: true }),
		});

		await makeEngine(provider, { presenceEnabled: false }).runSync();

		expect(calendarImportStub.firstCall.args[0].busy).to.be.false;
	});

	it('should skip and count users without a resolvable mailbox without failing the batch', async () => {
		usersFindStub.returns([{ _id: 'u1', emails: [{ address: 'no@example.com', verified: false }] }, user('u2')]);
		const provider = makeProvider({
			listEvents: sinon.stub().resolves({ events: [externalEvent('e1')], deletedEventIds: [], full: true }),
		});

		const summary = await makeEngine(provider).runSync();

		expect(summary?.usersSkippedNoMailbox).to.equal(1);
		expect(summary?.usersProcessed).to.equal(1);
		expect(summary?.usersFailed).to.equal(0);
		expect(calendarImportStub.calledOnce).to.be.true;
		expect(calendarImportStub.firstCall.args[0].uid).to.equal('u2');
	});

	it('should delete events reported as removed, but only when they belong to server sync', async () => {
		usersFindStub.returns([user('u1')]);
		findOneByExternalIdAndUserIdStub.withArgs('gone-server', 'u1').resolves({ _id: 'ev1', provider: 'microsoft-graph' });
		findOneByExternalIdAndUserIdStub.withArgs('gone-legacy', 'u1').resolves({ _id: 'ev2' });
		const provider = makeProvider({
			listEvents: sinon.stub().resolves({ events: [], deletedEventIds: ['gone-server', 'gone-legacy'], full: false }),
		});

		const summary = await makeEngine(provider).runSync();

		expect(calendarDeleteStub.calledOnceWith('ev1')).to.be.true;
		expect(summary?.eventsDeleted).to.equal(1);
	});

	it('should diff full snapshots against stored events and delete the missing ones', async () => {
		usersFindStub.returns([user('u1')]);
		findServerSyncedStub.returns([
			{ _id: 'ev-stale', externalId: 'stale', provider: 'microsoft-graph' },
			{ _id: 'ev-kept', externalId: 'e1', provider: 'microsoft-graph' },
		]);
		const provider = makeProvider({
			listEvents: sinon.stub().resolves({ events: [externalEvent('e1')], deletedEventIds: [], full: true }),
		});

		const summary = await makeEngine(provider).runSync();

		expect(calendarDeleteStub.calledOnceWith('ev-stale')).to.be.true;
		expect(summary?.eventsDeleted).to.equal(1);
	});

	it('should not diff-delete on incremental (delta) results', async () => {
		usersFindStub.returns([user('u1')]);
		syncStateFindOneStub.resolves({
			uid: 'u1',
			mailbox: 'u1@example.com',
			provider: 'microsoft-graph',
			deltaToken: 'd0',
			deltaWindowStart: new Date('2026-01-01T00:00:00Z'),
			deltaWindowEnd: new Date('2100-01-01T00:00:00Z'),
		});
		const listEvents = sinon.stub().resolves({ events: [], deletedEventIds: [], full: false, nextDeltaToken: 'd1' });
		const provider = makeProvider({ listEvents });

		await makeEngine(provider).runSync();

		expect(listEvents.firstCall.args[2]).to.equal('d0');
		expect(findServerSyncedStub.called).to.be.false;
		expect(calendarDeleteStub.called).to.be.false;
	});

	it('should ignore the stored delta token when the window outgrew its epoch, the mailbox or provider changed', async () => {
		usersFindStub.returns([user('u1')]);
		syncStateFindOneStub.resolves({
			uid: 'u1',
			mailbox: 'u1@example.com',
			provider: 'microsoft-graph',
			deltaToken: 'd0',
			deltaWindowStart: new Date('2026-07-01T00:00:00Z'),
			// epoch already ended: rolling window end is past it
			deltaWindowEnd: new Date('2026-07-10T00:00:00Z'),
		});
		const listEvents = sinon.stub().resolves({ events: [], deletedEventIds: [], full: true, nextDeltaToken: 'd1' });
		const provider = makeProvider({ listEvents });

		await makeEngine(provider).runSync();

		expect(listEvents.firstCall.args[2]).to.be.undefined;
	});

	it('should treat cancelled events as deletions', async () => {
		usersFindStub.returns([user('u1')]);
		findOneByExternalIdAndUserIdStub.withArgs('e1', 'u1').resolves({ _id: 'ev1', provider: 'microsoft-graph' });
		const provider = makeProvider({
			listEvents: sinon.stub().resolves({ events: [externalEvent('e1', { isCancelled: true })], deletedEventIds: [], full: false }),
		});

		await makeEngine(provider).runSync();

		expect(calendarImportStub.called).to.be.false;
		expect(calendarDeleteStub.calledOnceWith('ev1')).to.be.true;
	});

	it('should record per-user failures and keep processing the remaining users', async () => {
		usersFindStub.returns([user('u1'), user('u2')]);
		const listEvents = sinon.stub();
		listEvents
			.withArgs('u1@example.com', sinon.match.any, sinon.match.any)
			.rejects(Object.assign(new Error('denied'), { code: 'consent-missing' }));
		listEvents.withArgs('u2@example.com', sinon.match.any, sinon.match.any).resolves({ events: [], deletedEventIds: [], full: true });
		const provider = makeProvider({ listEvents });

		const summary = await makeEngine(provider).runSync();

		expect(summary?.usersFailed).to.equal(1);
		expect(summary?.usersProcessed).to.equal(1);
		expect(recordFailureStub.calledOnce).to.be.true;
		expect(recordFailureStub.firstCall.args[0]).to.equal('u1');
		expect(recordFailureStub.firstCall.args[1].error.code).to.equal('consent-missing');
		expect(recordSuccessStub.calledOnceWith('u2')).to.be.true;
	});

	describe('change-notification subscriptions', () => {
		const WEBHOOK_CONFIG = { webhooksEnabled: true, webhookUrl: 'https://chat.example.com/api/v1/calendar-sync.webhook' };

		const subscribableProvider = (overrides: Record<string, unknown> = {}) =>
			makeProvider({
				supportsWebhooks: true,
				createSubscription: sinon.stub().resolves({ id: 'sub-new', expiresAt: new Date(Date.now() + 70 * 60 * 60 * 1000) }),
				renewSubscription: sinon.stub().resolves({ id: 'sub-old', expiresAt: new Date(Date.now() + 70 * 60 * 60 * 1000) }),
				...overrides,
			});

		it('should create a subscription after a successful sync when none exists', async () => {
			usersFindStub.returns([user('u1')]);
			const provider = subscribableProvider();

			await makeEngine(provider, WEBHOOK_CONFIG).runSync();

			expect(provider.createSubscription.calledOnce).to.be.true;
			const [mailbox, url, clientState] = provider.createSubscription.firstCall.args;
			expect(mailbox).to.equal('u1@example.com');
			expect(url).to.equal(WEBHOOK_CONFIG.webhookUrl);
			expect(clientState).to.be.a('string').with.lengthOf.greaterThan(20);

			expect(setSubscriptionStub.calledOnce).to.be.true;
			expect(setSubscriptionStub.firstCall.args[1]).to.deep.include({ id: 'sub-new', clientState });
		});

		it('should renew a subscription close to expiry and keep its clientState', async () => {
			usersFindStub.returns([user('u1')]);
			syncStateFindOneStub.resolves({
				uid: 'u1',
				mailbox: 'u1@example.com',
				provider: 'microsoft-graph',
				subscriptionId: 'sub-old',
				subscriptionExpiresAt: new Date(Date.now() + 60 * 60 * 1000), // 1h left
				subscriptionClientState: 'keep-me',
			});
			const provider = subscribableProvider();

			await makeEngine(provider, WEBHOOK_CONFIG).runSync();

			expect(provider.renewSubscription.calledOnceWith('sub-old')).to.be.true;
			expect(provider.createSubscription.called).to.be.false;
			expect(setSubscriptionStub.firstCall.args[1].clientState).to.equal('keep-me');
		});

		it('should recreate the subscription when renewal fails', async () => {
			usersFindStub.returns([user('u1')]);
			syncStateFindOneStub.resolves({
				uid: 'u1',
				mailbox: 'u1@example.com',
				provider: 'microsoft-graph',
				subscriptionId: 'sub-old',
				subscriptionExpiresAt: new Date(Date.now() + 60 * 60 * 1000),
				subscriptionClientState: 'old-state',
			});
			const provider = subscribableProvider({
				renewSubscription: sinon.stub().rejects(new Error('gone')),
			});

			await makeEngine(provider, WEBHOOK_CONFIG).runSync();

			expect(provider.createSubscription.calledOnce).to.be.true;
		});

		it('should leave healthy subscriptions alone and do nothing when webhooks are disabled', async () => {
			usersFindStub.returns([user('u1')]);
			syncStateFindOneStub.resolves({
				uid: 'u1',
				mailbox: 'u1@example.com',
				provider: 'microsoft-graph',
				subscriptionId: 'sub-old',
				subscriptionExpiresAt: new Date(Date.now() + 60 * 60 * 60 * 1000), // 60h left
				subscriptionClientState: 's',
			});
			const healthy = subscribableProvider();
			await makeEngine(healthy, WEBHOOK_CONFIG).runSync();
			expect(healthy.createSubscription.called).to.be.false;
			expect(healthy.renewSubscription.called).to.be.false;

			usersFindStub.returns([user('u1')]);
			syncStateFindOneStub.resolves(null);
			const disabled = subscribableProvider();
			await makeEngine(disabled).runSync();
			expect(disabled.createSubscription.called).to.be.false;
		});

		it('should never fail the user sync because of subscription errors', async () => {
			usersFindStub.returns([user('u1')]);
			const provider = subscribableProvider({
				createSubscription: sinon.stub().rejects(new Error('subscription quota exceeded')),
			});

			const summary = await makeEngine(provider, WEBHOOK_CONFIG).runSync();

			expect(summary?.usersProcessed).to.equal(1);
			expect(summary?.usersFailed).to.equal(0);
		});
	});

	describe('syncUserById', () => {
		it('should sync a single user on demand', async () => {
			usersFindOneByIdStub.withArgs('u1').resolves(user('u1'));
			const provider = makeProvider({
				listEvents: sinon.stub().resolves({ events: [externalEvent('e1')], deletedEventIds: [], full: true }),
			});

			const ok = await makeEngine(provider).syncUserById('u1');

			expect(ok).to.be.true;
			expect(calendarImportStub.calledOnce).to.be.true;
			expect(calendarImportStub.firstCall.args[0].uid).to.equal('u1');
		});

		it('should return false for unknown users, failed syncs and non-event modes', async () => {
			const provider = makeProvider();
			expect(await makeEngine(provider).syncUserById('missing')).to.be.false;

			usersFindOneByIdStub.withArgs('u1').resolves(user('u1'));
			expect(await makeEngine(provider, { mode: 'free-busy-only' }).syncUserById('u1')).to.be.false;

			const failing = makeProvider({ listEvents: sinon.stub().rejects(new Error('down')) });
			expect(await makeEngine(failing).syncUserById('u1')).to.be.false;
		});
	});

	it('should restrict the user query to the configured roles', async () => {
		usersFindStub.returns([]);
		const provider = makeProvider();

		await makeEngine(provider, { roles: ['sales', 'support'] }).runSync();
		expect(usersFindStub.firstCall.args[0]).to.deep.include({ roles: { $in: ['sales', 'support'] } });

		usersFindStub.resetHistory();
		usersFindStub.returns([]);
		await makeEngine(provider).runSync();
		expect(usersFindStub.firstCall.args[0]).to.not.have.property('roles');
	});

	it('should do nothing when no provider is configured', async () => {
		const summary = await makeEngine(null).runSync();
		expect(summary).to.be.null;
		expect(usersFindStub.called).to.be.false;
	});

	it('should skip free-busy-only runs when presence updates are disabled', async () => {
		const provider = makeProvider();
		const summary = await makeEngine(provider, { mode: 'free-busy-only', presenceEnabled: false }).runSync();
		expect(summary).to.be.null;
		expect(provider.listEvents.called).to.be.false;
		expect(provider.getFreeBusy.called).to.be.false;
	});

	describe('free-busy-only mode', () => {
		const NOW_MS_TOLERANCE = 5_000;
		const inMinutes = (minutes: number) => new Date(Date.now() + minutes * 60_000);

		it('should drive presence from availability without creating any event records', async () => {
			usersFindStub.returns([user('u1')]);
			const getFreeBusy = sinon.stub().resolves([
				{
					mailbox: 'u1@example.com',
					intervals: [{ start: inMinutes(-30), end: inMinutes(30), status: 'busy' }],
				},
			]);
			const provider = makeProvider({ getFreeBusy });

			const summary = await makeEngine(provider, { mode: 'free-busy-only' }).runSync();

			expect(provider.listEvents.called).to.be.false;
			expect(calendarImportStub.called).to.be.false;

			expect(setActiveStateStub.calledOnce).to.be.true;
			const [uid, state] = setActiveStateStub.firstCall.args;
			expect(uid).to.equal('u1');
			expect(state.statusId).to.equal('calendar');
			expect(state.statusSource).to.equal('external');
			expect(state.statusText).to.equal('Presence_status_outlook_in_a_meeting');
			expect(state.statusExpiresAt.getTime()).to.be.closeTo(inMinutes(30).getTime(), NOW_MS_TOLERANCE);

			expect(summary?.usersProcessed).to.equal(1);
			expect(summary?.eventsUpserted).to.equal(0);
			expect(recordSuccessStub.calledOnce).to.be.true;
			expect(recordSuccessStub.firstCall.args[1].deltaToken).to.be.undefined;
		});

		it('should merge back-to-back busy intervals into one expiry', async () => {
			usersFindStub.returns([user('u1')]);
			const provider = makeProvider({
				getFreeBusy: sinon.stub().resolves([
					{
						mailbox: 'u1@example.com',
						intervals: [
							{ start: inMinutes(-10), end: inMinutes(20), status: 'busy' },
							{ start: inMinutes(20), end: inMinutes(50), status: 'tentative' },
							{ start: inMinutes(120), end: inMinutes(150), status: 'busy' }, // detached: must not extend
						],
					},
				]),
			});

			await makeEngine(provider, { mode: 'free-busy-only' }).runSync();

			expect(setActiveStateStub.firstCall.args[1].statusExpiresAt.getTime()).to.be.closeTo(inMinutes(50).getTime(), NOW_MS_TOLERANCE);
		});

		it('should end the calendar claim when the user is not busy now', async () => {
			usersFindStub.returns([user('u1')]);
			const provider = makeProvider({
				getFreeBusy: sinon.stub().resolves([
					{
						mailbox: 'u1@example.com',
						intervals: [{ start: inMinutes(60), end: inMinutes(90), status: 'busy' }],
					},
				]),
			});

			const summary = await makeEngine(provider, { mode: 'free-busy-only' }).runSync();

			expect(setActiveStateStub.called).to.be.false;
			expect(endActiveStateStub.calledOnceWith('u1', 'calendar')).to.be.true;
			expect(summary?.usersProcessed).to.equal(1);
		});

		it('should batch all mailboxes into a single availability request', async () => {
			usersFindStub.returns([user('u1'), user('u2'), { _id: 'u3', emails: [{ address: 'x', verified: false }] }]);
			const getFreeBusy = sinon.stub().resolves([
				{ mailbox: 'u1@example.com', intervals: [] },
				{ mailbox: 'u2@example.com', intervals: [] },
			]);
			const provider = makeProvider({ getFreeBusy });

			const summary = await makeEngine(provider, { mode: 'free-busy-only' }).runSync();

			expect(getFreeBusy.calledOnce).to.be.true;
			expect(getFreeBusy.firstCall.args[0]).to.deep.equal(['u1@example.com', 'u2@example.com']);
			expect(summary?.usersSkippedNoMailbox).to.equal(1);
			expect(summary?.usersProcessed).to.equal(2);
		});

		it('should record per-mailbox availability errors without failing the batch', async () => {
			usersFindStub.returns([user('u1'), user('u2')]);
			const provider = makeProvider({
				getFreeBusy: sinon.stub().resolves([
					{ mailbox: 'u1@example.com', intervals: [], error: { code: 'schedule-unavailable', message: 'nope' } },
					{ mailbox: 'u2@example.com', intervals: [] },
				]),
			});

			const summary = await makeEngine(provider, { mode: 'free-busy-only' }).runSync();

			expect(summary?.usersFailed).to.equal(1);
			expect(summary?.usersProcessed).to.equal(1);
			expect(recordFailureStub.calledOnce).to.be.true;
			expect(recordFailureStub.firstCall.args[0]).to.equal('u1');
			expect(recordFailureStub.firstCall.args[1].error.code).to.equal('schedule-unavailable');
		});

		it('should fail the whole batch gracefully when the availability request throws', async () => {
			usersFindStub.returns([user('u1'), user('u2')]);
			const provider = makeProvider({
				getFreeBusy: sinon.stub().rejects(Object.assign(new Error('down'), { code: 'network-error' })),
			});

			const summary = await makeEngine(provider, { mode: 'free-busy-only' }).runSync();

			expect(summary?.usersFailed).to.equal(2);
			expect(recordFailureStub.callCount).to.equal(2);
			expect(setActiveStateStub.called).to.be.false;
		});
	});

	describe('computeBusyUntil', () => {
		const now = new Date('2026-07-11T12:00:00Z');
		const at = (iso: string) => new Date(iso);

		it('should return null when no interval covers now', () => {
			expect(computeBusyUntil([], now)).to.be.null;
			expect(computeBusyUntil([{ start: at('2026-07-11T13:00:00Z'), end: at('2026-07-11T14:00:00Z'), status: 'busy' }], now)).to.be.null;
		});

		it('should return the end of the covering interval', () => {
			const result = computeBusyUntil([{ start: at('2026-07-11T11:00:00Z'), end: at('2026-07-11T12:30:00Z'), status: 'busy' }], now);
			expect(result?.toISOString()).to.equal('2026-07-11T12:30:00.000Z');
		});

		it('should chain overlapping and adjacent intervals regardless of input order', () => {
			const result = computeBusyUntil(
				[
					{ start: at('2026-07-11T13:00:00Z'), end: at('2026-07-11T14:00:00Z'), status: 'busy' },
					{ start: at('2026-07-11T11:30:00Z'), end: at('2026-07-11T12:15:00Z'), status: 'busy' },
					{ start: at('2026-07-11T12:10:00Z'), end: at('2026-07-11T13:00:00Z'), status: 'oof' },
				],
				now,
			);
			expect(result?.toISOString()).to.equal('2026-07-11T14:00:00.000Z');
		});

		it('should not extend past a gap', () => {
			const result = computeBusyUntil(
				[
					{ start: at('2026-07-11T11:00:00Z'), end: at('2026-07-11T12:30:00Z'), status: 'busy' },
					{ start: at('2026-07-11T12:45:00Z'), end: at('2026-07-11T14:00:00Z'), status: 'busy' },
				],
				now,
			);
			expect(result?.toISOString()).to.equal('2026-07-11T12:30:00.000Z');
		});
	});

	it('should not overlap concurrent runs', async () => {
		usersFindStub.returns([user('u1')]);
		let release!: () => void;
		const gate = new Promise<void>((resolve) => {
			release = resolve;
		});
		const listEvents = sinon.stub().callsFake(async () => {
			await gate;
			return { events: [], deletedEventIds: [], full: true };
		});
		const provider = makeProvider({ listEvents });
		const engine = makeEngine(provider);

		const first = engine.runSync();
		const second = await engine.runSync();
		expect(second).to.be.null;

		release();
		const summary = await first;
		expect(summary?.usersProcessed).to.equal(1);
		expect(listEvents.calledOnce).to.be.true;
	});
});
