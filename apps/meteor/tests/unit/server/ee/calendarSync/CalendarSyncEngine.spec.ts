import { expect } from 'chai';
import { describe, it, beforeEach } from 'mocha';
import proxyquire from 'proxyquire';
import sinon from 'sinon';

const calendarImportStub = sinon.stub();
const calendarDeleteStub = sinon.stub();
const usersFindStub = sinon.stub();
const findOneByExternalIdAndUserIdStub = sinon.stub();
const findServerSyncedStub = sinon.stub();
const syncStateFindOneStub = sinon.stub();
const recordSuccessStub = sinon.stub();
const recordFailureStub = sinon.stub();

const { CalendarSyncEngine } = proxyquire.noCallThru().load('../../../../../ee/server/lib/calendarSync/CalendarSyncEngine.ts', {
	'@rocket.chat/core-services': {
		Calendar: {
			import: calendarImportStub,
			delete: calendarDeleteStub,
		},
	},
	'@rocket.chat/models': {
		Users: { find: usersFindStub },
		CalendarEvent: {
			findOneByExternalIdAndUserId: findOneByExternalIdAndUserIdStub,
			findServerSyncedByUserIdBetweenDates: findServerSyncedStub,
		},
		CalendarSyncState: {
			findOneByUserId: syncStateFindOneStub,
			recordSuccess: recordSuccessStub,
			recordFailure: recordFailureStub,
		},
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

const makeProvider = (overrides: Record<string, unknown> = {}) => ({
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

	it('should do nothing when no provider is configured', async () => {
		const summary = await makeEngine(null).runSync();
		expect(summary).to.be.null;
		expect(usersFindStub.called).to.be.false;
	});

	it('should skip runs in free-busy-only mode until the mode is implemented', async () => {
		const provider = makeProvider();
		const summary = await makeEngine(provider, { mode: 'free-busy-only' }).runSync();
		expect(summary).to.be.null;
		expect(provider.listEvents.called).to.be.false;
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
