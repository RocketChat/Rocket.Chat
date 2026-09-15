import { randomUUID } from 'crypto';

import { Calendar, Presence } from '@rocket.chat/core-services';
import type { ICalendarSyncState, IUser } from '@rocket.chat/core-typings';
import { UserStatus } from '@rocket.chat/core-typings';
import { CalendarEvent, CalendarSyncState, Users } from '@rocket.chat/models';

import type { ICalendarSyncProvider, ICalendarSyncWindow, IExternalCalendarEvent, IFreeBusyInterval } from './definition';
import { CalendarSyncError } from './definition';
import { sanitizeError } from './logSanitizer';
import type { MailboxSource } from './mailboxResolver';
import { resolveMailbox } from './mailboxResolver';
import { i18n } from '../../../../server/lib/i18n';

export interface ICalendarSyncEngineConfig {
	mode: 'full-events' | 'free-busy-only';
	windowDays: number;
	batchSize: number;
	presenceEnabled: boolean;
	mailboxSource: MailboxSource;
	mailboxCustomField: string;
	defaultLanguage: string;
	/** Restrict sync to users holding any of these roles; empty = all active users */
	roles: string[];
	/** Change-notification webhooks (optional optimization; polling always continues) */
	webhooksEnabled: boolean;
	/** Public URL of the calendar-sync.webhook endpoint; empty when not derivable */
	webhookUrl: string;
}

export interface ICalendarSyncRunSummary {
	startedAt: Date;
	durationMs: number;
	usersProcessed: number;
	usersSkippedNoMailbox: number;
	usersFailed: number;
	eventsUpserted: number;
	eventsDeleted: number;
}

interface ILoggerLike {
	debug(...args: unknown[]): void;
	info(...args: unknown[]): void;
	warn(...args: unknown[]): void;
	error(...args: unknown[]): void;
}

/** Keep using a delta token while the requested window still fits its epoch window */
const DELTA_EPOCH_BUFFER_MS = 24 * 60 * 60 * 1000;

/** Availability lookahead in free/busy-only mode; long meetings keep extending on later runs */
const FREE_BUSY_WINDOW_HOURS = 4;

/** Shared presence-claim id — must match the legacy CalendarService's claim so both paths compose */
const CALENDAR_STATUS_ID = 'calendar';

/** Renew change-notification subscriptions when they have less than this left */
const SUBSCRIPTION_RENEW_THRESHOLD_MS = 24 * 60 * 60 * 1000;

type SyncableUser = Pick<IUser, '_id' | 'emails' | 'customFields' | 'username' | 'language'>;

/**
 * Returns when the user's current busy block ends, merging back-to-back intervals,
 * or null when the user is not busy at `now`. Expects no particular input order.
 */
export function computeBusyUntil(intervals: IFreeBusyInterval[], now: Date): Date | null {
	const sorted = [...intervals].sort((a, b) => a.start.getTime() - b.start.getTime());

	let busyUntil: Date | null = null;
	for (const interval of sorted) {
		const current: Date | null = busyUntil;
		const coversNow = interval.start <= now && interval.end > now;
		const extendsBlock = current !== null && interval.start <= current && interval.end > current;
		if ((coversNow || extendsBlock) && (current === null || interval.end > current)) {
			busyUntil = interval.end;
		}
	}

	return busyUntil;
}

export class CalendarSyncEngine {
	private running = false;

	private lastRunSummary: ICalendarSyncRunSummary | null = null;

	constructor(
		private readonly getProvider: () => ICalendarSyncProvider | null,
		private readonly getConfig: () => ICalendarSyncEngineConfig,
		private readonly logger: ILoggerLike,
	) {}

	public getLastRunSummary(): ICalendarSyncRunSummary | null {
		return this.lastRunSummary;
	}

	public isRunning(): boolean {
		return this.running;
	}

	public async runSync(): Promise<ICalendarSyncRunSummary | null> {
		if (this.running) {
			this.logger.warn('Previous calendar sync run still in progress; skipping this cycle');
			return null;
		}

		this.running = true;
		try {
			return await this.doRun();
		} finally {
			this.running = false;
		}
	}

	private async doRun(): Promise<ICalendarSyncRunSummary | null> {
		const provider = this.getProvider();
		if (!provider) {
			this.logger.warn('Calendar sync is enabled but the configured provider is not available');
			return null;
		}

		const config = this.getConfig();
		if (config.mode === 'free-busy-only' && !config.presenceEnabled) {
			this.logger.warn('Calendar sync is in free/busy-only mode but presence updates are disabled; nothing to do');
			return null;
		}

		const startedAt = new Date();
		const summary: ICalendarSyncRunSummary = {
			startedAt,
			durationMs: 0,
			usersProcessed: 0,
			usersSkippedNoMailbox: 0,
			usersFailed: 0,
			eventsUpserted: 0,
			eventsDeleted: 0,
		};

		// Free/busy only needs to know whether users are busy right now (and until when);
		// full event sync uses the admin-configured rolling window
		const window: ICalendarSyncWindow = {
			start: startedAt,
			end:
				config.mode === 'free-busy-only'
					? new Date(startedAt.getTime() + FREE_BUSY_WINDOW_HOURS * 60 * 60 * 1000)
					: new Date(startedAt.getTime() + config.windowDays * 24 * 60 * 60 * 1000),
		};

		const projection: Record<string, number> = { emails: 1, username: 1, language: 1 };
		if (config.mailboxSource === 'custom-field' && config.mailboxCustomField) {
			projection[`customFields.${config.mailboxCustomField}`] = 1;
		}

		const cursor = Users.find<SyncableUser>(
			{ active: true, type: 'user', ...(config.roles.length && { roles: { $in: config.roles } }) },
			{ projection },
		);

		const batchSize = Math.max(1, config.batchSize);
		let batch: SyncableUser[] = [];

		const flush = async (): Promise<void> => {
			if (!batch.length) {
				return;
			}
			const users = batch;
			batch = [];
			if (config.mode === 'free-busy-only') {
				await this.syncBatchFreeBusy(users, provider, window, config, summary);
				return;
			}
			await Promise.all(users.map((user) => this.syncUser(user, provider, window, config, summary)));
		};

		for await (const user of cursor) {
			batch.push(user);
			if (batch.length >= batchSize) {
				await flush();
			}
		}
		await flush();

		summary.durationMs = Date.now() - startedAt.getTime();
		this.lastRunSummary = summary;
		this.logger.info(
			`Calendar sync run finished in ${summary.durationMs}ms: ${summary.usersProcessed} synced, ` +
				`${summary.usersSkippedNoMailbox} without mailbox, ${summary.usersFailed} failed, ` +
				`${summary.eventsUpserted} events upserted, ${summary.eventsDeleted} deleted`,
		);

		return summary;
	}

	private async syncUser(
		user: Pick<IUser, '_id' | 'emails' | 'customFields'>,
		provider: ICalendarSyncProvider,
		window: ICalendarSyncWindow,
		config: ICalendarSyncEngineConfig,
		summary: ICalendarSyncRunSummary,
	): Promise<void> {
		const mailbox = resolveMailbox(user, config.mailboxSource, config.mailboxCustomField);
		if (!mailbox) {
			summary.usersSkippedNoMailbox++;
			return;
		}

		try {
			const state = await CalendarSyncState.findOneByUserId(user._id);
			const deltaToken = this.getUsableDeltaToken(provider, state, mailbox, window);

			// When establishing a new delta epoch, extend the window so the token stays
			// usable for subsequent runs until the rolling window outgrows the buffer
			const effectiveWindow: ICalendarSyncWindow = deltaToken
				? window
				: { start: window.start, end: new Date(window.end.getTime() + DELTA_EPOCH_BUFFER_MS) };

			const result = await provider.listEvents(mailbox, effectiveWindow, deltaToken);

			const seenExternalIds = new Set<string>();
			for (const event of result.events) {
				if (event.isCancelled) {
					summary.eventsDeleted += await this.deleteByExternalId(user._id, event.externalId);
					continue;
				}
				seenExternalIds.add(event.externalId);
				await this.upsertEvent(user._id, provider, event, config);
				summary.eventsUpserted++;
			}

			for (const externalId of result.deletedEventIds) {
				summary.eventsDeleted += await this.deleteByExternalId(user._id, externalId);
			}

			if (result.full) {
				summary.eventsDeleted += await this.deleteMissingEvents(user._id, effectiveWindow, seenExternalIds);
			}

			await CalendarSyncState.recordSuccess(user._id, {
				mailbox,
				provider: provider.type,
				at: new Date(),
				...(result.nextDeltaToken !== undefined && {
					deltaToken: result.nextDeltaToken,
					deltaWindowStart: result.full ? effectiveWindow.start : state?.deltaWindowStart,
					deltaWindowEnd: result.full ? effectiveWindow.end : state?.deltaWindowEnd,
				}),
			});

			await this.maintainSubscription(user._id, mailbox, provider, state, config);

			summary.usersProcessed++;
		} catch (error) {
			summary.usersFailed++;
			const sanitized = sanitizeError(error);
			this.logger.error(`Calendar sync failed for user ${user._id}: [${sanitized.code}] ${sanitized.message}`);
			await CalendarSyncState.recordFailure(user._id, {
				mailbox,
				provider: provider.type,
				error: { ...sanitized, at: new Date() },
			}).catch((stateError) => this.logger.error(`Unable to record calendar sync failure for user ${user._id}`, stateError));
		}
	}

	/**
	 * Immediately re-syncs a single user, used by change-notification webhooks.
	 * Returns false when the user is out of scope or the sync failed.
	 */
	public async syncUserById(uid: IUser['_id']): Promise<boolean> {
		const provider = this.getProvider();
		const config = this.getConfig();
		if (!provider || config.mode !== 'full-events') {
			return false;
		}

		const projection: Record<string, number> = { emails: 1, username: 1, language: 1 };
		if (config.mailboxSource === 'custom-field' && config.mailboxCustomField) {
			projection[`customFields.${config.mailboxCustomField}`] = 1;
		}

		const user = await Users.findOneById<SyncableUser>(uid, { projection });
		if (!user) {
			return false;
		}

		const now = new Date();
		const window: ICalendarSyncWindow = {
			start: now,
			end: new Date(now.getTime() + config.windowDays * 24 * 60 * 60 * 1000),
		};
		const summary: ICalendarSyncRunSummary = {
			startedAt: now,
			durationMs: 0,
			usersProcessed: 0,
			usersSkippedNoMailbox: 0,
			usersFailed: 0,
			eventsUpserted: 0,
			eventsDeleted: 0,
		};

		await this.syncUser(user, provider, window, config, summary);
		return summary.usersProcessed === 1;
	}

	/**
	 * Keeps the user's change-notification subscription alive: creates one when
	 * missing, renews it inside the threshold. Failures are logged, never thrown —
	 * webhooks are an optimization on top of polling, not a dependency.
	 */
	private async maintainSubscription(
		uid: IUser['_id'],
		mailbox: string,
		provider: ICalendarSyncProvider,
		state: ICalendarSyncState | null,
		config: ICalendarSyncEngineConfig,
	): Promise<void> {
		if (!config.webhooksEnabled || !config.webhookUrl || !provider.supportsWebhooks) {
			return;
		}
		if (!provider.createSubscription || !provider.renewSubscription) {
			return;
		}

		try {
			const remainingMs = state?.subscriptionExpiresAt ? state.subscriptionExpiresAt.getTime() - Date.now() : 0;
			if (state?.subscriptionId && remainingMs > SUBSCRIPTION_RENEW_THRESHOLD_MS) {
				return;
			}

			if (state?.subscriptionId && state.subscriptionClientState && remainingMs > 0) {
				try {
					const renewed = await provider.renewSubscription(state.subscriptionId);
					await CalendarSyncState.setSubscription(uid, {
						id: renewed.id,
						expiresAt: renewed.expiresAt,
						clientState: state.subscriptionClientState,
					});
					return;
				} catch {
					// expired or gone on the provider side — recreate below
				}
			}

			const clientState = randomUUID();
			const created = await provider.createSubscription(mailbox, config.webhookUrl, clientState);
			await CalendarSyncState.setSubscription(uid, { id: created.id, expiresAt: created.expiresAt, clientState });
		} catch (error) {
			const sanitized = sanitizeError(error);
			this.logger.warn(`Unable to maintain the calendar subscription for user ${uid}: [${sanitized.code}] ${sanitized.message}`);
		}
	}

	/**
	 * Free/busy-only mode: one availability request per user batch drives presence
	 * directly, without ever ingesting or storing event subjects/details.
	 */
	private async syncBatchFreeBusy(
		users: SyncableUser[],
		provider: ICalendarSyncProvider,
		window: ICalendarSyncWindow,
		config: ICalendarSyncEngineConfig,
		summary: ICalendarSyncRunSummary,
	): Promise<void> {
		const entries = users.flatMap((user) => {
			const mailbox = resolveMailbox(user, config.mailboxSource, config.mailboxCustomField);
			if (!mailbox) {
				summary.usersSkippedNoMailbox++;
				return [];
			}
			return [{ user, mailbox }];
		});

		if (!entries.length) {
			return;
		}

		let results;
		try {
			results = await provider.getFreeBusy(
				entries.map((entry) => entry.mailbox),
				window,
			);
		} catch (error) {
			const sanitized = sanitizeError(error);
			this.logger.error(`Calendar free/busy sync failed for a batch of ${entries.length} users: [${sanitized.code}] ${sanitized.message}`);
			const at = new Date();
			await Promise.all(
				entries.map(({ user, mailbox }) => {
					summary.usersFailed++;
					return CalendarSyncState.recordFailure(user._id, { mailbox, provider: provider.type, error: { ...sanitized, at } }).catch(
						(stateError) => this.logger.error(`Unable to record calendar sync failure for user ${user._id}`, stateError),
					);
				}),
			);
			return;
		}

		const byMailbox = new Map(results.map((result) => [result.mailbox.toLowerCase(), result]));
		const now = new Date();

		await Promise.all(
			entries.map(async ({ user, mailbox }) => {
				const result = byMailbox.get(mailbox.toLowerCase());
				try {
					if (!result || result.error) {
						throw new CalendarSyncError(
							result?.error?.code ?? 'missing-availability',
							result?.error?.message ?? 'no availability returned',
						);
					}

					await this.applyFreeBusyPresence(user, result.intervals, now, config);
					await CalendarSyncState.recordSuccess(user._id, { mailbox, provider: provider.type, at: now });
					summary.usersProcessed++;
				} catch (error) {
					summary.usersFailed++;
					const sanitized = sanitizeError(error);
					this.logger.error(`Calendar free/busy sync failed for user ${user._id}: [${sanitized.code}] ${sanitized.message}`);
					await CalendarSyncState.recordFailure(user._id, { mailbox, provider: provider.type, error: { ...sanitized, at: now } }).catch(
						(stateError) => this.logger.error(`Unable to record calendar sync failure for user ${user._id}`, stateError),
					);
				}
			}),
		);
	}

	/** Applies (or ends) the same presence claim the legacy calendar service uses */
	private async applyFreeBusyPresence(
		user: SyncableUser,
		intervals: IFreeBusyInterval[],
		now: Date,
		config: ICalendarSyncEngineConfig,
	): Promise<void> {
		const busyUntil = computeBusyUntil(intervals, now);

		if (!busyUntil) {
			await Presence.endActiveState(user._id, CALENDAR_STATUS_ID);
			return;
		}

		await Presence.setActiveState(user._id, {
			statusDefault: UserStatus.BUSY,
			statusText: i18n.t('Presence_status_outlook_in_a_meeting', { lng: user.language || config.defaultLanguage }),
			statusSource: 'external',
			statusExpiresAt: busyUntil,
			statusId: CALENDAR_STATUS_ID,
		});
	}

	private getUsableDeltaToken(
		provider: ICalendarSyncProvider,
		state: ICalendarSyncState | null,
		mailbox: string,
		window: ICalendarSyncWindow,
	): string | undefined {
		if (!provider.supportsDelta || !state?.deltaToken) {
			return undefined;
		}
		if (state.provider !== provider.type || state.mailbox !== mailbox) {
			return undefined;
		}
		if (!state.deltaWindowEnd || window.end.getTime() > state.deltaWindowEnd.getTime()) {
			return undefined;
		}
		return state.deltaToken;
	}

	private async upsertEvent(
		uid: IUser['_id'],
		provider: ICalendarSyncProvider,
		event: IExternalCalendarEvent,
		config: ICalendarSyncEngineConfig,
	): Promise<void> {
		await Calendar.import({
			uid,
			externalId: event.externalId,
			subject: event.subject,
			description: event.description,
			startTime: event.startTime,
			endTime: event.endTime,
			busy: config.presenceEnabled ? event.busy : false,
			provider: provider.type,
			...(event.iCalUId && { iCalUId: event.iCalUId }),
			...(event.meetingUrl && { meetingUrl: event.meetingUrl }),
		});
	}

	private async deleteByExternalId(uid: IUser['_id'], externalId: string): Promise<number> {
		const event = await CalendarEvent.findOneByExternalIdAndUserId(externalId, uid);
		// Only remove events owned by server sync; a provider-id collision must never delete client-pushed events
		if (!event?.provider) {
			return 0;
		}
		await Calendar.delete(event._id);
		return 1;
	}

	private async deleteMissingEvents(uid: IUser['_id'], window: ICalendarSyncWindow, seenExternalIds: Set<string>): Promise<number> {
		let deleted = 0;
		for await (const event of CalendarEvent.findServerSyncedByUserIdBetweenDates(uid, window.start, window.end)) {
			if (event.externalId && !seenExternalIds.has(event.externalId)) {
				await Calendar.delete(event._id);
				deleted++;
			}
		}
		return deleted;
	}
}
