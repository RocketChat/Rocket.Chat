import { createHash, timingSafeEqual } from 'node:crypto';

export type GraphChangeNotification = {
	subscriptionId?: string;
	clientState?: string;
	resource?: string;
	changeType?: string;
	sequenceNumber?: string;
	lifecycleEvent?: 'missed' | 'subscriptionRemoved' | 'reauthorizationRequired';
};

export interface INotificationDeduplicationStore {
	claim(key: string, expiresAt: Date): Promise<boolean>;
}

export interface ICalendarSyncQueue {
	enqueueSubscription(subscriptionId: string, reason: 'change' | 'missed' | 'subscription-removed' | 'reauthorize'): Promise<void>;
}

export type NotificationProcessingResult = { accepted: number; rejected: number; enqueued: number };

const safeEqual = (actual: string, expected: string): boolean => {
	const left = Buffer.from(actual);
	const right = Buffer.from(expected);
	return left.length === right.length && timingSafeEqual(left, right);
};

const getNotificationReason = (
	lifecycleEvent: GraphChangeNotification['lifecycleEvent'],
): 'change' | 'missed' | 'subscription-removed' | 'reauthorize' => {
	switch (lifecycleEvent) {
		case 'missed':
			return 'missed';
		case 'subscriptionRemoved':
			return 'subscription-removed';
		case 'reauthorizationRequired':
			return 'reauthorize';
		default:
			return 'change';
	}
};

export class GraphNotificationProcessor {
	constructor(
		private readonly expectedClientState: string,
		private readonly deduplication: INotificationDeduplicationStore,
		private readonly queue: ICalendarSyncQueue,
		private readonly now: () => Date = () => new Date(),
	) {
		if (!expectedClientState) throw new Error('webhook-client-state-required');
	}

	async process(notifications: GraphChangeNotification[]): Promise<NotificationProcessingResult> {
		const subscriptions = new Map<string, 'change' | 'missed' | 'subscription-removed' | 'reauthorize'>();
		let rejected = 0;
		let accepted = 0;
		for (const notification of notifications.slice(0, 1_000)) {
			if (!notification.subscriptionId || !notification.clientState || !safeEqual(notification.clientState, this.expectedClientState)) {
				rejected++;
				continue;
			}
			const fingerprint = createHash('sha256')
				.update(notification.subscriptionId)
				.update('\0')
				.update(notification.sequenceNumber ?? notification.resource ?? notification.changeType ?? notification.lifecycleEvent ?? '')
				.digest('base64url');
			if (!(await this.deduplication.claim(fingerprint, new Date(this.now().getTime() + 15 * 60_000)))) continue;
			accepted++;
			const reason = getNotificationReason(notification.lifecycleEvent);
			subscriptions.set(notification.subscriptionId, reason);
		}
		for (const [subscriptionId, reason] of subscriptions) await this.queue.enqueueSubscription(subscriptionId, reason);
		return { accepted, rejected, enqueued: subscriptions.size };
	}
}

export const validateGraphHandshake = (value: unknown): string | null => {
	if (typeof value !== 'string' || value.length === 0 || value.length > 255 || /[\r\n\0]/.test(value)) return null;
	return value;
};
