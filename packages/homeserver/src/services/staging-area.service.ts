import { injectable } from 'tsyringe';
import type { EventBase } from '../models/event.model';
import {
	type StagingAreaEventType,
	StagingAreaQueue,
} from '../queues/staging-area.queue';
import { Lock } from '../utils/lock.decorator';
import { createLogger } from '../utils/logger';
import { EventAuthorizationService } from './event-authorization.service';
import { EventStateService } from './event-state.service';
import { EventService, EventType } from './event.service';
import { MissingEventService } from './missing-event.service';

// ProcessingState indicates where in the flow an event is
enum ProcessingState {
	PENDING_DEPENDENCIES = 'pending_dependencies',
	PENDING_AUTHORIZATION = 'pending_authorization',
	PENDING_STATE_RESOLUTION = 'pending_state_resolution',
	PENDING_PERSISTENCE = 'pending_persistence',
	PENDING_FEDERATION = 'pending_federation',
	PENDING_NOTIFICATION = 'pending_notification',
	COMPLETED = 'completed',
	REJECTED = 'rejected',
}

// ExtendedStagingEvent adds processing state to track event flow
interface ExtendedStagingEvent extends StagingAreaEventType {
	state: ProcessingState;
	error?: string;
	missingEvents?: string[];
	retryCount?: number;
}

@injectable()
export class StagingAreaService {
	private processingEvents = new Map<string, ExtendedStagingEvent>();
	private readonly logger = createLogger('StagingAreaService');

	constructor(
		private readonly eventService: EventService,
		private readonly missingEventsService: MissingEventService,
		private readonly stagingAreaQueue: StagingAreaQueue,
		private readonly eventAuthService: EventAuthorizationService,
		private readonly eventStateService: EventStateService,
	) {
		this.processQueue();
	}

	addEventToQueue(event: StagingAreaEventType) {
		const extendedEvent: ExtendedStagingEvent = {
			...event,
			state: ProcessingState.PENDING_DEPENDENCIES,
			retryCount: 0,
		};

		this.processingEvents.set(event.eventId, extendedEvent);

		this.stagingAreaQueue.enqueue({
			...event,
			metadata: {
				state: ProcessingState.PENDING_DEPENDENCIES,
			},
		});

		this.logger.debug(`Added event ${event.eventId} to processing queue`);
	}

	private async processQueue() {
		setInterval(async () => {
			const event = this.stagingAreaQueue.dequeue();
			if (event) {
				await this.processEvent(event);
			}
		}, 100);
	}

	extractEventsFromIncomingPDU(pdu: StagingAreaEventType) {
		const authEvents = pdu.event.auth_events || [];
		const prevEvents = pdu.event.prev_events || [];
		return [...authEvents, ...prevEvents];
	}

	@Lock({ timeout: 10000, keyPath: 'event.room_id' })
	async processEvent(event: StagingAreaEventType & { metadata?: any }) {
		const eventId = event.eventId;
		const trackedEvent = this.processingEvents.get(eventId);

		if (!trackedEvent) {
			this.processingEvents.set(eventId, {
				...event,
				state: ProcessingState.PENDING_DEPENDENCIES,
				retryCount: 0,
			});
			await this.processDependencyStage(event);
			return;
		}

		const currentState = event.metadata?.state || trackedEvent.state;

		switch (currentState) {
			case ProcessingState.PENDING_DEPENDENCIES:
				await this.processDependencyStage(event);
				break;

			case ProcessingState.PENDING_AUTHORIZATION:
				await this.processAuthorizationStage(event);
				break;

			case ProcessingState.PENDING_STATE_RESOLUTION:
				await this.processStateResolutionStage(event);
				break;

			case ProcessingState.PENDING_PERSISTENCE:
				await this.processPersistenceStage(event);
				break;

			case ProcessingState.PENDING_FEDERATION:
				await this.processFederationStage(event);
				break;

			case ProcessingState.PENDING_NOTIFICATION:
				await this.processNotificationStage(event);
				break;

			case ProcessingState.COMPLETED:
				// Event is fully processed
				this.logger.debug(`Event ${eventId} fully processed`);
				this.processingEvents.delete(eventId);
				break;

			case ProcessingState.REJECTED:
				// Event was rejected, clean up
				this.logger.warn(
					`Event ${eventId} was rejected: ${trackedEvent.error}`,
				);
				this.processingEvents.delete(eventId);
				break;
		}
	}

	private async processDependencyStage(event: StagingAreaEventType) {
		const eventId = event.eventId;
		const trackedEvent = this.processingEvents.get(eventId);
		if (!trackedEvent) return;

		const eventIds = this.extractEventsFromIncomingPDU(event);
		this.logger.debug(
			`Checking dependencies for event ${eventId}: ${eventIds.length} references`,
		);

		const { missing } = await this.eventService.checkIfEventsExists(
			eventIds.flat(),
		);

		if (missing.length > 0) {
			this.logger.debug(`Missing ${missing.length} events for ${eventId}`);
			trackedEvent.missingEvents = missing;

			for (const missingId of missing) {
				this.logger.debug(
					`Adding missing event ${missingId} to missing events service`,
				);
				this.missingEventsService.addEvent({
					eventId: missingId,
					roomId: event.roomId,
					origin: event.origin,
				});
			}

			trackedEvent.retryCount = (trackedEvent.retryCount || 0) + 1;

			if (trackedEvent.retryCount < 5) {
				setTimeout(() => {
					this.stagingAreaQueue.enqueue({
						...event,
						metadata: {
							state: ProcessingState.PENDING_DEPENDENCIES,
						},
					});
				}, 1000 * trackedEvent.retryCount); // Exponential backoff
			} else {
				trackedEvent.state = ProcessingState.REJECTED;
				trackedEvent.error = `Failed to fetch dependencies after ${trackedEvent.retryCount} attempts`;
				this.processingEvents.set(eventId, trackedEvent);
			}
		} else {
			trackedEvent.state = ProcessingState.PENDING_AUTHORIZATION;
			this.processingEvents.set(eventId, trackedEvent);
			this.stagingAreaQueue.enqueue({
				...event,
				metadata: {
					state: ProcessingState.PENDING_AUTHORIZATION,
				},
			});
		}
	}

	private async processAuthorizationStage(event: StagingAreaEventType) {
		const eventId = event.eventId;
		const trackedEvent = this.processingEvents.get(eventId);
		if (!trackedEvent) return;

		try {
			this.logger.debug(`Authorizing event ${eventId}`);
			const authEvents = await this.eventService.getAuthEventIds(
				EventType.MESSAGE,
				{ roomId: event.roomId, senderId: event.event.sender },
			);

			const isAuthorized = await this.eventAuthService.authorizeEvent(
				event.event,
				authEvents as unknown as EventBase[],
			);

			if (isAuthorized) {
				trackedEvent.state = ProcessingState.PENDING_STATE_RESOLUTION;
				this.processingEvents.set(eventId, trackedEvent);
				this.stagingAreaQueue.enqueue({
					...event,
					metadata: {
						state: ProcessingState.PENDING_STATE_RESOLUTION,
					},
				});
			} else {
				trackedEvent.state = ProcessingState.REJECTED;
				trackedEvent.error = 'Event failed authorization checks';
				this.processingEvents.set(eventId, trackedEvent);
			}
		} catch (error: any) {
			trackedEvent.state = ProcessingState.REJECTED;
			trackedEvent.error = `Authorization error: ${error?.message || String(error)}`;
			this.processingEvents.set(eventId, trackedEvent);
		}
	}

	private async processStateResolutionStage(event: StagingAreaEventType) {
		const eventId = event.eventId;
		const trackedEvent = this.processingEvents.get(eventId);
		if (!trackedEvent) return;

		try {
			this.logger.debug(`Resolving state for event ${eventId}`);
			const isStateEvent = event.event.state_key !== undefined;

			if (isStateEvent) {
				await this.eventStateService.resolveState(event.roomId, event.eventId);
			}

			trackedEvent.state = ProcessingState.PENDING_PERSISTENCE;
			this.processingEvents.set(eventId, trackedEvent);
			this.stagingAreaQueue.enqueue({
				...event,
				metadata: {
					state: ProcessingState.PENDING_PERSISTENCE,
				},
			});
		} catch (error: any) {
			trackedEvent.state = ProcessingState.REJECTED;
			trackedEvent.error = `State resolution error: ${error?.message || String(error)}`;
			this.processingEvents.set(eventId, trackedEvent);
		}
	}

	private async processPersistenceStage(event: StagingAreaEventType) {
		const eventId = event.eventId;
		const trackedEvent = this.processingEvents.get(eventId);
		if (!trackedEvent) return;

		try {
			this.logger.debug(`Persisting event ${eventId}`);
			await this.eventService.insertEvent(event.event as any);

			trackedEvent.state = ProcessingState.PENDING_FEDERATION;
			this.processingEvents.set(eventId, trackedEvent);

			this.stagingAreaQueue.enqueue({
				...event,
				metadata: {
					state: ProcessingState.PENDING_FEDERATION,
				},
			});
		} catch (error: any) {
			trackedEvent.state = ProcessingState.REJECTED;
			trackedEvent.error = `Persistence error: ${error?.message || String(error)}`;
			this.processingEvents.set(eventId, trackedEvent);
		}
	}

	private async processFederationStage(event: StagingAreaEventType) {
		const eventId = event.eventId;
		const trackedEvent = this.processingEvents.get(eventId);
		if (!trackedEvent) return;

		try {
			this.logger.debug(`Federating event ${eventId}`);

			// Send event to other servers in the room
			// await this.federationService.sendEventToServers(event.roomId, event.event);

			trackedEvent.state = ProcessingState.PENDING_NOTIFICATION;
			this.processingEvents.set(eventId, trackedEvent);
			this.stagingAreaQueue.enqueue({
				...event,
				metadata: {
					state: ProcessingState.PENDING_NOTIFICATION,
				},
			});
		} catch (error: any) {
			this.logger.warn(
				`Federation error for ${eventId}: ${error?.message || String(error)}`,
			);

			trackedEvent.state = ProcessingState.PENDING_NOTIFICATION;
			this.processingEvents.set(eventId, trackedEvent);

			this.stagingAreaQueue.enqueue({
				...event,
				metadata: {
					state: ProcessingState.PENDING_NOTIFICATION,
				},
			});
		}
	}

	private async processNotificationStage(event: StagingAreaEventType) {
		const eventId = event.eventId;
		const trackedEvent = this.processingEvents.get(eventId);
		if (!trackedEvent) return;

		try {
			this.logger.debug(`Notifying clients about event ${eventId}`);

			// await this.notificationService.notifyClientsOfEvent(event.roomId, event.event);

			trackedEvent.state = ProcessingState.COMPLETED;
		} catch (error: unknown) {
			this.logger.warn(
				`Notification error for ${event.eventId}: ${String(error)}`,
			);
			trackedEvent.state = ProcessingState.COMPLETED;
		}

		this.processingEvents.set(event.eventId, trackedEvent);
	}
}
