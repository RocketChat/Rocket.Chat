import { CalendarSyncState } from '@rocket.chat/models';

import type { CalendarSyncEngine } from './CalendarSyncEngine';

export interface IGraphChangeNotification {
	subscriptionId?: string;
	clientState?: string;
}

export interface IGraphNotificationPayload {
	value?: IGraphChangeNotification[];
}

interface ILoggerLike {
	warn(...args: unknown[]): void;
	error(...args: unknown[]): void;
}

/**
 * Handles a Microsoft Graph change-notification payload: notifications are matched
 * to their per-user subscription and authenticated via the stored clientState
 * (unknown or mismatched notifications are dropped), then the affected users are
 * re-synced immediately. Sync content never comes from the notification itself —
 * it only triggers the regular (delta) sync path.
 */
export async function processGraphNotifications(
	payload: IGraphNotificationPayload,
	engine: Pick<CalendarSyncEngine, 'syncUserById'>,
	logger: ILoggerLike,
): Promise<void> {
	const notifications = Array.isArray(payload?.value) ? payload.value : [];
	const uids = new Set<string>();

	for (const notification of notifications) {
		if (typeof notification?.subscriptionId !== 'string' || typeof notification?.clientState !== 'string') {
			continue;
		}

		const state = await CalendarSyncState.findOneBySubscriptionId(notification.subscriptionId);
		if (!state) {
			continue;
		}
		if (state.subscriptionClientState !== notification.clientState) {
			logger.warn(`Dropping calendar change notification with mismatched clientState for subscription ${notification.subscriptionId}`);
			continue;
		}

		uids.add(state.uid);
	}

	for (const uid of uids) {
		try {
			await engine.syncUserById(uid);
		} catch (error) {
			logger.error(`Calendar sync triggered by change notification failed for user ${uid}`, error);
		}
	}
}
