import { CalendarProviderRegistry, EnterpriseCalendarOrchestrator } from './orchestrator';
import { CalendarPresenceProjector } from './presenceProjection';
import { CalendarProjectionFactory } from './projection';
import type {
	CalendarProjection,
	CalendarSyncState,
	ICalendarProjectionStore,
	ICalendarSyncStateStore,
	IEnterpriseCalendarProvider,
} from './types';

describe('EnterpriseCalendarOrchestrator', () => {
	it('performs an idempotent bounded full sync and recomputes presence from persisted projections', async () => {
		const mailbox = { provider: 'exchange-ews' as const, address: 'person@example.com' };
		const event = {
			externalId: 'provider-id',
			mailbox,
			start: new Date('2026-07-11T11:00:00Z'),
			end: new Date('2026-07-11T13:00:00Z'),
			availability: 'busy' as const,
			isCancelled: false,
			isAllDay: false,
			isPrivate: true,
		};
		const provider: IEnterpriseCalendarProvider = {
			type: 'exchange-ews',
			validateConfiguration: async () => ({ valid: true }),
			resolveMailbox: async () => mailbox,
			getCalendarWindow: jest.fn().mockResolvedValue([event]),
			synchronizeChanges: jest.fn(),
		};
		let state: CalendarSyncState | null = null;
		let persisted: CalendarProjection[] = [];
		const states: ICalendarSyncStateStore = {
			get: async () => state,
			save: async (value) => {
				state = value;
			},
		};
		const projections: ICalendarProjectionStore = {
			upsert: async (values) => {
				persisted = values;
			},
			remove: async () => undefined,
			replaceWindow: async (_userId, _provider, _start, _end, values) => {
				persisted = values;
			},
			findActive: async () => persisted,
			removeExpired: async () => 0,
		};
		const presence = { apply: jest.fn().mockResolvedValue(undefined), clear: jest.fn().mockResolvedValue(undefined) };
		const registry = new CalendarProviderRegistry();
		registry.register(provider);
		const orchestrator = new EnterpriseCalendarOrchestrator(
			registry,
			states,
			projections,
			new CalendarProjectionFactory(Buffer.alloc(32, 1)),
			new CalendarPresenceProjector(presence),
			{ pastMs: 60_000, futureMs: 60_000 },
			() => new Date('2026-07-11T12:00:00Z'),
		);

		await orchestrator.synchronize('u1', mailbox);
		expect(provider.getCalendarWindow).toHaveBeenCalledWith(mailbox, new Date('2026-07-11T11:59:00Z'), new Date('2026-07-11T12:01:00Z'));
		expect(persisted[0]).toMatchObject({ userId: 'u1', isPrivate: true, availability: 'busy' });
		expect(persisted[0].eventHash).not.toContain('provider-id');
		expect(presence.apply).toHaveBeenCalledWith('u1', 'busy', event.end);
		expect(state).toMatchObject({ retryCount: 0, fullResyncRequired: false });
	});
});
