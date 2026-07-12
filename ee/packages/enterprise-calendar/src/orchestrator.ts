import { EnterpriseCalendarError } from './errors';
import { MicrosoftGraphCalendarProvider } from './graphProvider';
import type { CalendarPresenceProjector } from './presenceProjection';
import type { CalendarProjectionFactory } from './projection';
import { calculateBackoffMs } from './retry';
import type {
	CalendarMailboxIdentity,
	ICalendarProjectionStore,
	CalendarSyncState,
	ICalendarSyncStateStore,
	IEnterpriseCalendarProvider,
} from './types';

export class CalendarProviderRegistry {
	private readonly providers = new Map<string, IEnterpriseCalendarProvider>();

	register(provider: IEnterpriseCalendarProvider): void {
		if (this.providers.has(provider.type)) throw new Error(`calendar-provider-already-registered:${provider.type}`);
		this.providers.set(provider.type, provider);
	}

	get(type: CalendarMailboxIdentity['provider']): IEnterpriseCalendarProvider {
		const provider = this.providers.get(type);
		if (!provider) throw new Error(`calendar-provider-not-configured:${type}`);
		return provider;
	}
}

export type SyncWindowPolicy = { pastMs: number; futureMs: number; maxMs?: number };

export class EnterpriseCalendarOrchestrator {
	constructor(
		private readonly registry: CalendarProviderRegistry,
		private readonly states: ICalendarSyncStateStore,
		private readonly projections: ICalendarProjectionStore,
		private readonly projectionFactory: CalendarProjectionFactory,
		private readonly presence: CalendarPresenceProjector,
		private readonly windowPolicy: SyncWindowPolicy = { pastMs: 60 * 60_000, futureMs: 14 * 24 * 60 * 60_000 },
		private readonly now: () => Date = () => new Date(),
	) {}

	async synchronize(userId: string, mailbox: CalendarMailboxIdentity, forceFull = false): Promise<boolean> {
		const attemptedAt = this.now();
		const existing = (await this.states.get(userId)) ?? this.createState(userId, mailbox);
		if (existing.backoffUntil && existing.backoffUntil > attemptedAt && !forceFull) return false;
		const mailboxChanged =
			existing.mailbox.provider !== mailbox.provider ||
			existing.mailbox.address.toLocaleLowerCase('en-US') !== mailbox.address.toLocaleLowerCase('en-US') ||
			existing.mailbox.externalUserId !== mailbox.externalUserId ||
			existing.mailbox.tenantId !== mailbox.tenantId;
		const state = {
			...existing,
			mailbox,
			lastAttemptAt: attemptedAt,
			...(mailboxChanged && { cursor: undefined, fullResyncRequired: true, retryCount: 0, backoffUntil: undefined }),
		};
		await this.states.save(state);

		try {
			const provider = this.registry.get(mailbox.provider);
			const rollingWindowInvalid =
				state.cursor &&
				(state.cursor.windowEnd <= attemptedAt ||
					attemptedAt.getTime() - state.cursor.windowStart.getTime() > (this.windowPolicy.maxMs ?? 120 * 86_400_000));
			if (forceFull || state.fullResyncRequired || !state.cursor || rollingWindowInvalid) {
				await this.fullSync(userId, mailbox, provider, attemptedAt, state);
			} else {
				await this.incrementalSync(userId, mailbox, provider, state);
			}
			const active = await this.projections.findActive(userId, this.now());
			await this.presence.recompute(userId, active, this.now());
			return true;
		} catch (error) {
			const retryable = error instanceof EnterpriseCalendarError ? error.retryable : true;
			const retryCount = state.retryCount + 1;
			await this.states.save({
				...state,
				retryCount,
				lastErrorCategory: error instanceof EnterpriseCalendarError ? error.category : 'unknown',
				...(retryable && {
					backoffUntil: new Date(
						this.now().getTime() +
							calculateBackoffMs(retryCount, { retryAfterMs: error instanceof EnterpriseCalendarError ? error.retryAfterMs : undefined }),
					),
				}),
			});
			throw error;
		}
	}

	private async fullSync(
		userId: string,
		mailbox: CalendarMailboxIdentity,
		provider: IEnterpriseCalendarProvider,
		now: Date,
		state: CalendarSyncState,
	): Promise<void> {
		const start = new Date(now.getTime() - this.windowPolicy.pastMs);
		const end = new Date(now.getTime() + this.windowPolicy.futureMs);
		const result =
			provider instanceof MicrosoftGraphCalendarProvider
				? await provider.getInitialDelta(mailbox, start, end)
				: { events: await provider.getCalendarWindow(mailbox, start, end), deletedExternalIds: [] };
		const normalized = result.events.map((event) => this.projectionFactory.fromEvent(userId, event)).filter((event) => event !== null);
		await this.projections.replaceWindow(userId, mailbox.provider, start, end, normalized);
		await this.states.save({
			...state,
			cursor: result.nextCursor,
			lastSuccessAt: this.now(),
			retryCount: 0,
			fullResyncRequired: false,
			lastErrorCategory: undefined,
			backoffUntil: undefined,
		});
	}

	private async incrementalSync(
		userId: string,
		mailbox: CalendarMailboxIdentity,
		provider: IEnterpriseCalendarProvider,
		state: CalendarSyncState,
	): Promise<void> {
		if (!state.cursor) throw new Error('calendar-cursor-required');
		const result = await provider.synchronizeChanges(mailbox, state.cursor);
		if (result.requiresFullResync) {
			await this.states.save({ ...state, fullResyncRequired: true, cursor: undefined });
			await this.synchronize(userId, mailbox, true);
			return;
		}
		const upserts = result.events.map((event) => this.projectionFactory.fromEvent(userId, event)).filter((event) => event !== null);
		const implicitDeletes = result.events
			.filter((event) => event.isCancelled || event.availability === 'free')
			.map((event) => event.externalId);
		await this.projections.upsert(upserts);
		await this.projections.remove(
			userId,
			mailbox.provider,
			[...result.deletedExternalIds, ...implicitDeletes].map((id) => this.projectionFactory.eventHash(id)),
		);
		await this.states.save({
			...state,
			cursor: result.nextCursor ?? state.cursor,
			lastSuccessAt: this.now(),
			retryCount: 0,
			fullResyncRequired: false,
			lastErrorCategory: undefined,
			backoffUntil: undefined,
		});
	}

	private createState(userId: string, mailbox: CalendarMailboxIdentity): CalendarSyncState {
		return { userId, mailbox, retryCount: 0, fullResyncRequired: true };
	}
}
