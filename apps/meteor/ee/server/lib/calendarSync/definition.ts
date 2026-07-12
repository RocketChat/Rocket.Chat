import type { CalendarSyncProviderType } from '@rocket.chat/core-typings';

export interface ICalendarSyncWindow {
	start: Date;
	end: Date;
}

export interface IExternalCalendarEvent {
	/** Provider-stable event id, used as the upsert key (`externalId`) */
	externalId: string;
	/** iCalendar UID, stable across providers when available */
	iCalUId?: string;
	subject: string;
	description: string;
	startTime: Date;
	endTime: Date;
	busy: boolean;
	meetingUrl?: string;
	isCancelled?: boolean;
}

export interface ICalendarSyncListResult {
	events: IExternalCalendarEvent[];
	/** Provider event ids reported as removed (delta/incremental results only) */
	deletedEventIds: string[];
	nextDeltaToken?: string;
	/** True when `events` is a complete snapshot of the window (enables deletion diffing) */
	full: boolean;
}

export type FreeBusyStatus = 'busy' | 'tentative' | 'oof';

export interface IFreeBusyInterval {
	start: Date;
	end: Date;
	status: FreeBusyStatus;
}

export interface IFreeBusyResult {
	mailbox: string;
	intervals: IFreeBusyInterval[];
	error?: { code: string; message: string };
}

export interface IConnectionTestResult {
	ok: boolean;
	error?: { code: string; message: string };
}

export interface ICalendarSubscription {
	id: string;
	expiresAt: Date;
}

export interface ICalendarSyncProvider {
	readonly type: CalendarSyncProviderType;
	readonly supportsDelta: boolean;
	readonly supportsWebhooks: boolean;

	/** With `probeMailbox` the check also proves calendar access/impersonation on that mailbox */
	testConnection(probeMailbox?: string): Promise<IConnectionTestResult>;
	getFreeBusy(mailboxes: string[], window: ICalendarSyncWindow): Promise<IFreeBusyResult[]>;
	listEvents(mailbox: string, window: ICalendarSyncWindow, deltaToken?: string): Promise<ICalendarSyncListResult>;

	/** Change-notification subscriptions; only present when supportsWebhooks is true */
	createSubscription?(mailbox: string, notificationUrl: string, clientState: string): Promise<ICalendarSubscription>;
	renewSubscription?(subscriptionId: string): Promise<ICalendarSubscription>;
	deleteSubscription?(subscriptionId: string): Promise<void>;
}

export class CalendarSyncError extends Error {
	constructor(
		public readonly code: string,
		message: string,
	) {
		super(message);
		this.name = 'CalendarSyncError';
	}
}

/**
 * Minimal response surface consumed by the providers; matches the shape returned
 * by @rocket.chat/server-fetch so a plain stub can be injected in unit tests.
 */
export interface IMinimalFetchResponse {
	ok: boolean;
	status: number;
	headers: { get(name: string): string | null };
	json(): Promise<any>;
	text(): Promise<string>;
}

export type CalendarSyncFetchFn = (
	url: string,
	options?: {
		method?: string;
		headers?: Record<string, string>;
		body?: string;
		timeout?: number;
	},
) => Promise<IMinimalFetchResponse>;
