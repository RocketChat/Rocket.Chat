import type { IMessage } from '@rocket.chat/core-typings';
import client from 'prom-client';

const percentiles = [0.01, 0.1, 0.5, 0.9, 0.95, 0.99, 1];

/**
 * Gets an existing metric from the registry or creates it if it doesn't exist.
 * This ensures we don't get duplicate registration errors when the same metric
 * is accessed from different parts of the application.
 */
function getOrCreateMetric<T extends client.Metric>(name: string, createFn: () => T): T {
	const existing = client.register.getSingleMetric(name);
	if (existing) {
		return existing as T;
	}
	return createFn();
}

/**
 * Federation metrics for outgoing operations.
 * Incoming metrics are now collected by the SDK's EventEmitterService.
 */
export const federationMetrics = {
	// =====================================
	// OUTGOING METRICS
	// =====================================

	/** Counter for federation events processed (both incoming and outgoing) */
	get federationEventsProcessed() {
		return getOrCreateMetric(
			'rocketchat_federation_events_processed',
			() =>
				new client.Counter({
					name: 'rocketchat_federation_events_processed',
					labelNames: ['event_type', 'direction'],
					help: 'Total federation events processed',
				}),
		);
	},

	/** Counter for failed federation events (both incoming and outgoing) */
	get federationEventsFailed() {
		return getOrCreateMetric(
			'rocketchat_federation_events_failed',
			() =>
				new client.Counter({
					name: 'rocketchat_federation_events_failed',
					labelNames: ['event_type', 'direction', 'error_type'],
					help: 'Total federation events that failed to process',
				}),
		);
	},

	/** Counter for messages sent to federated rooms */
	get federatedMessagesSent() {
		return getOrCreateMetric(
			'rocketchat_federation_messages_sent',
			() =>
				new client.Counter({
					name: 'rocketchat_federation_messages_sent',
					labelNames: ['room_type', 'message_type'],
					help: 'Total messages sent to federated rooms',
				}),
		);
	},

	/** Counter for federated rooms created */
	get federatedRoomsCreated() {
		return getOrCreateMetric(
			'rocketchat_federation_rooms_created',
			() =>
				new client.Counter({
					name: 'rocketchat_federation_rooms_created',
					labelNames: ['room_type'],
					help: 'Total federated rooms created',
				}),
		);
	},

	/** Counter for federation invites sent */
	get federatedInvitesSent() {
		return getOrCreateMetric(
			'rocketchat_federation_invites_sent',
			() =>
				new client.Counter({
					name: 'rocketchat_federation_invites_sent',
					labelNames: ['room_type'],
					help: 'Total federation invites sent',
				}),
		);
	},

	/** Counter for reactions sent/removed */
	get federatedReactionsSent() {
		return getOrCreateMetric(
			'rocketchat_federation_reactions_sent',
			() =>
				new client.Counter({
					name: 'rocketchat_federation_reactions_sent',
					labelNames: ['action'],
					help: 'Total reactions sent or removed via federation',
				}),
		);
	},

	/** Duration to send a message via federation */
	get federationOutgoingMessageSendDuration() {
		return getOrCreateMetric(
			'rocketchat_federation_outgoing_message_send_duration_seconds',
			() =>
				new client.Summary({
					name: 'rocketchat_federation_outgoing_message_send_duration_seconds',
					labelNames: ['message_type'],
					help: 'Time to send a message via federation',
					percentiles,
				}),
		);
	},

	/** Duration to create a federated room */
	get federationRoomCreateDuration() {
		return getOrCreateMetric(
			'rocketchat_federation_room_create_duration_seconds',
			() =>
				new client.Summary({
					name: 'rocketchat_federation_room_create_duration_seconds',
					labelNames: ['room_type'],
					help: 'Time to create a federated room',
					percentiles,
				}),
		);
	},

	/** Duration to send an invitation via federation */
	get federationInviteSendDuration() {
		return getOrCreateMetric(
			'rocketchat_federation_invite_send_duration_seconds',
			() =>
				new client.Summary({
					name: 'rocketchat_federation_invite_send_duration_seconds',
					labelNames: ['room_type'],
					help: 'Time to send an invitation via federation',
					percentiles,
				}),
		);
	},
};

/**
 * Determines the message type from a Rocket.Chat message for outgoing metrics labeling.
 * @returns 'text' | 'file'
 */
export function determineOutgoingMessageType(message: IMessage): 'text' | 'file' {
	if (message.files && message.files.length > 0) {
		return 'file';
	}
	return 'text';
}
