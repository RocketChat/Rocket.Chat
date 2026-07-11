import type { ICalendarSyncState, IUser } from '@rocket.chat/core-typings';
import { Calendar } from '@rocket.chat/core-services';
import { CalendarEvent, CalendarSyncState, Users } from '@rocket.chat/models';

import type { ICalendarSyncProvider, ICalendarSyncWindow, IExternalCalendarEvent } from './definition';
import { sanitizeError } from './logSanitizer';
import type { MailboxSource } from './mailboxResolver';
import { resolveMailbox } from './mailboxResolver';

export interface ICalendarSyncEngineConfig {
	mode: 'full-events' | 'free-busy-only';
	windowDays: number;
	batchSize: number;
	presenceEnabled: boolean;
	mailboxSource: MailboxSource;
	mailboxCustomField: string;
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
		if (config.mode !== 'full-events') {
			// free/busy-only mode lands in a follow-up phase
			this.logger.warn(`Calendar sync mode "${config.mode}" is not supported yet; skipping run`);
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

		const window: ICalendarSyncWindow = {
			start: startedAt,
			end: new Date(startedAt.getTime() + config.windowDays * 24 * 60 * 60 * 1000),
		};

		const projection: Record<string, number> = { emails: 1, username: 1 };
		if (config.mailboxSource === 'custom-field' && config.mailboxCustomField) {
			projection[`customFields.${config.mailboxCustomField}`] = 1;
		}

		const cursor = Users.find<Pick<IUser, '_id' | 'emails' | 'customFields' | 'username'>>(
			{ active: true, type: 'user' },
			{ projection },
		);

		const batchSize = Math.max(1, config.batchSize);
		let batch: Pick<IUser, '_id' | 'emails' | 'customFields' | 'username'>[] = [];

		const flush = async (): Promise<void> => {
			if (!batch.length) {
				return;
			}
			const users = batch;
			batch = [];
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
