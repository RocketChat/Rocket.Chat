import { createLogger } from '../utils/logger';
import type { EventBase } from '../models/event.model';
import { injectable } from 'tsyringe';

@injectable()
export class EventAuthorizationService {
	private readonly logger = createLogger('EventAuthorizationService');

	async authorizeEvent(
		event: EventBase,
		authEvents: EventBase[],
	): Promise<boolean> {
		this.logger.debug(
			`Authorizing event ${event.event_id || 'unknown'} of type ${event.type}`,
		);

		// Simple implementation - would need proper auth rules based on Matrix spec
		// https://spec.matrix.org/v1.7/server-server-api/#checks-performed-on-receipt-of-a-pdu

		if (event.type === 'm.room.create') {
			return this.authorizeCreateEvent(event);
		}

		// Check sender is allowed to send this type of event
		const senderAllowed = this.checkSenderAllowed(event, authEvents);
		if (!senderAllowed) {
			this.logger.warn(
				`Sender ${event.sender} not allowed to send ${event.type}`,
			);
			return false;
		}

		// Check event-specific auth rules
		switch (event.type) {
			case 'm.room.member':
				return this.authorizeMemberEvent(event, authEvents);
			case 'm.room.power_levels':
				return this.authorizePowerLevelsEvent(event, authEvents);
			case 'm.room.join_rules':
				return this.authorizeJoinRulesEvent(event, authEvents);
			default:
				// For simplicity, we'll allow other event types
				return true;
		}
	}

	private authorizeCreateEvent(event: EventBase): boolean {
		// Create events must not have prev_events
		if (event.prev_events && event.prev_events.length > 0) {
			this.logger.warn('Create event has prev_events');
			return false;
		}

		// Create events must not have auth_events
		if (event.auth_events && event.auth_events.length > 0) {
			this.logger.warn('Create event has auth_events');
			return false;
		}

		return true;
	}

	private checkSenderAllowed(
		event: EventBase,
		authEvents: EventBase[],
	): boolean {
		// Find power levels
		const powerLevelsEvent = authEvents.find(
			(e) => e.type === 'm.room.power_levels',
		);
		if (!powerLevelsEvent) {
			// No power levels - only allow room creator?
			const createEvent = authEvents.find((e) => e.type === 'm.room.create');
			if (createEvent && createEvent.sender === event.sender) {
				return true;
			}

			// If no create event either, allow by default
			return !createEvent;
		}

		// Check if sender has permission - simplified implementation
		// Full implementation would need to check specific event type power levels
		return true;
	}

	private authorizeMemberEvent(
		_event: EventBase,
		_authEvents: EventBase[],
	): boolean {
		// Basic implementation - full one would check join rules, bans, etc.
		return true;
	}

	private authorizePowerLevelsEvent(
		_event: EventBase,
		_authEvents: EventBase[],
	): boolean {
		// Check sender has permission to change power levels
		return true;
	}

	private authorizeJoinRulesEvent(
		_event: EventBase,
		_authEvents: EventBase[],
	): boolean {
		// Check sender has permission to change join rules
		return true;
	}
}
