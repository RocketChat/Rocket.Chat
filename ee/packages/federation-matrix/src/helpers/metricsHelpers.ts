import type { FileMessageType } from '@rocket.chat/federation-sdk';
import client from 'prom-client';

import { fileTypes } from '../FederationMatrix';

const percentiles = [0.01, 0.1, 0.5, 0.9, 0.95, 0.99, 1];

/**
 * Gets an existing metric from the registry or creates it if it doesn't exist.
 * This ensures we don't get duplicate registration errors when the same metric
 * is accessed from different parts of the application.
 */
function getOrCreateMetric<T extends client.Metric>(
	name: string,
	createFn: () => T,
): T {
	const existing = client.register.getSingleMetric(name);
	if (existing) {
		return existing as T;
	}
	return createFn();
}

/**
 * Federation metrics for incoming operations.
 * These use getOrCreateMetric to safely access metrics that may already
 * be registered by the meteor app's metrics.ts.
 */
export const federationMetrics = {
	/** Counter for messages received from other federated servers */
	get federatedMessagesReceived() {
		return getOrCreateMetric('rocketchat_federation_messages_received', () =>
			new client.Counter({
				name: 'rocketchat_federation_messages_received',
				labelNames: ['room_type', 'message_type', 'origin'],
				help: 'Total federated messages received',
			}),
		);
	},

	/** Counter for rooms joined (users invited to rooms created elsewhere) */
	get federatedRoomsJoined() {
		return getOrCreateMetric('rocketchat_federation_rooms_joined', () =>
			new client.Counter({
				name: 'rocketchat_federation_rooms_joined',
				labelNames: ['room_type', 'origin'],
				help: 'Total federated rooms joined (users invited to rooms created elsewhere)',
			}),
		);
	},

	/** Counter for federation events processed */
	get federationEventsProcessed() {
		return getOrCreateMetric('rocketchat_federation_events_processed', () =>
			new client.Counter({
				name: 'rocketchat_federation_events_processed',
				labelNames: ['event_type', 'direction'],
				help: 'Total federation events processed',
			}),
		);
	},

	/** Counter for failed federation events */
	get federationEventsFailed() {
		return getOrCreateMetric('rocketchat_federation_events_failed', () =>
			new client.Counter({
				name: 'rocketchat_federation_events_failed',
				labelNames: ['event_type', 'direction', 'error_type'],
				help: 'Total federation events that failed to process',
			}),
		);
	},

	/** Duration to process incoming federation transaction */
	get federationTransactionProcessDuration() {
		return getOrCreateMetric('rocketchat_federation_transaction_process_duration_seconds', () =>
			new client.Summary({
				name: 'rocketchat_federation_transaction_process_duration_seconds',
				labelNames: ['pdu_count', 'edu_count', 'origin'],
				help: 'Time to process incoming federation transaction',
				percentiles,
			}),
		);
	},

	/** Duration to process incoming federated message */
	get federationIncomingMessageProcessDuration() {
		return getOrCreateMetric('rocketchat_federation_incoming_message_process_duration_seconds', () =>
			new client.Summary({
				name: 'rocketchat_federation_incoming_message_process_duration_seconds',
				labelNames: ['message_type'],
				help: 'Time to process incoming federated message',
				percentiles,
			}),
		);
	},

	/** Duration to join a federated room (invite acceptance) */
	get federationRoomJoinDuration() {
		return getOrCreateMetric('rocketchat_federation_room_join_duration_seconds', () =>
			new client.Summary({
				name: 'rocketchat_federation_room_join_duration_seconds',
				labelNames: ['origin'],
				help: 'Time to join a federated room (invite acceptance)',
				percentiles,
			}),
		);
	},
};

/**
 * Extracts the origin server domain from a Matrix room ID.
 * @example extractOriginFromMatrixRoomId('!room:matrix.org') // 'matrix.org'
 */
export function extractOriginFromMatrixRoomId(roomId: string): string {
	return roomId.split(':').pop() || 'unknown';
}

/**
 * Extracts the origin server domain from a Matrix user ID.
 * @example extractOriginFromMatrixUserId('@user:matrix.org') // 'matrix.org'
 */
export function extractOriginFromMatrixUserId(userId: string): string {
	return userId.split(':').pop() || 'unknown';
}

/**
 * Determines the message type from a Matrix event for metrics labeling.
 * @returns 'text' | 'file' | 'encrypted'
 */
export function determineMessageType(event: {
	type?: string;
	content?: { msgtype?: string };
}): 'text' | 'file' | 'encrypted' {
	if (event.type === 'm.room.encrypted') {
		return 'encrypted';
	}

	const msgtype = event.content?.msgtype;
	if (msgtype && Object.values(fileTypes).includes(msgtype as FileMessageType)) {
		return 'file';
	}

	return 'text';
}

/**
 * Bucketizes PDU count for metrics labeling to avoid high cardinality.
 * Groups counts into buckets: 0, 1, 2-5, 6-10, 11-50, 51+
 */
export function bucketizePduCount(count: number): string {
	if (count === 0) return '0';
	if (count === 1) return '1';
	if (count <= 5) return '2-5';
	if (count <= 10) return '6-10';
	if (count <= 50) return '11-50';
	return '51+';
}

/**
 * Bucketizes EDU count for metrics labeling to avoid high cardinality.
 * Groups counts into buckets: 0, 1, 2-5, 6-10, 11+
 */
export function bucketizeEduCount(count: number): string {
	if (count === 0) return '0';
	if (count === 1) return '1';
	if (count <= 5) return '2-5';
	if (count <= 10) return '6-10';
	return '11+';
}
