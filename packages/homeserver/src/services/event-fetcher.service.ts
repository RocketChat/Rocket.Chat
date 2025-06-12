import { FederationService } from '../federation-sdk';
import {
	isFederationEventWithPDUs,
	type MatrixPDU,
} from '../core/events/pdu';
import { createLogger } from '../utils/logger';
import { generateId } from '../authentication';
import { EventRepository } from '../repositories/event.repository';
import type { EventBase } from '../models/event.model';
import { ConfigService } from './config.service';
import { injectable } from 'tsyringe';

export interface FetchedEvents {
	events: { eventId: string; event: EventBase }[];
	missingEventIds: string[];
}

@injectable()
export class EventFetcherService {
	private readonly logger = createLogger('EventFetcherService');

	constructor(
		private readonly eventRepository: EventRepository,
		private readonly federationService: FederationService,
		private readonly configService: ConfigService,
	) {}

	public async fetchEventsByIds(
		eventIds: string[],
		roomId: string,
		originServer: string,
	): Promise<FetchedEvents> {
		this.logger.debug(`Fetching ${eventIds.length} events for room ${roomId}`);

		if (!eventIds || eventIds.length === 0) {
			return { events: [], missingEventIds: [] };
		}

		// Try to get events from local database
		const localEvents: { eventId: string; event: EventBase }[] = [];
		const dbEvents = await this.eventRepository.find(
			{ _id: { $in: eventIds } },
			{},
		);

		localEvents.push(
			...dbEvents.map(({ _id, event }) => ({ eventId: _id, event })),
		);
		this.logger.debug(`Found ${localEvents.length} events in local database`);

		if (localEvents.length === eventIds.length) {
			return {
				events: localEvents,
				missingEventIds: [],
			};
		}

		// For events we don't have locally, try federation
		const missingEventIds = eventIds.filter(
			(id) => !localEvents.some((e) => e.eventId === id),
		);
		if (missingEventIds.length > 0) {
			this.logger.debug(
				`Fetching ${missingEventIds.length} missing events from federation ${Array.from(missingEventIds).join(', ')} ${originServer}`,
			);
			const federationEvents = await this.fetchEventsFromFederation(
				missingEventIds,
				originServer,
			);

			const federationEventsWithIds = federationEvents.map((e) => ({
				eventId: e.event_id ? String(e.event_id) : generateId(e),
				event: e,
			}));

			return {
				events: [...localEvents, ...federationEventsWithIds],
				missingEventIds: missingEventIds.filter(
					(id) => !federationEventsWithIds.some((e) => e.eventId === id),
				),
			};
		}

		return {
			events: localEvents,
			missingEventIds: [],
		};
	}

	public async fetchAuthEventsByTypes(
		missingTypes: string[],
		roomId: string,
	): Promise<Record<string, EventBase[]>> {
		const results: Record<string, EventBase[]> = {};

		try {
			// Find auth events of the required types in the room
			const authEvents = await this.eventRepository.find(
				{
					'event.room_id': roomId,
					'event.type': { $in: missingTypes },
				},
				{},
			);

			// Group events by type
			return authEvents.reduce(
				(acc, event) => {
					if (event.event.type) {
						if (!acc[event.event.type]) {
							acc[event.event.type] = [];
						}
						acc[event.event.type].push(event.event);
					}
					return acc;
				},
				{} as Record<string, EventBase[]>,
			);
		} catch (error: unknown) {
			const errorMessage =
				error instanceof Error ? error.message : String(error);
			this.logger.error(`Error fetching auth events by type: ${errorMessage}`);
			return results;
		}
	}

	private async fetchEventsFromFederation(
		eventIds: string[],
		targetServerName: string,
	): Promise<MatrixPDU[]> {
		const eventsToReturn: MatrixPDU[] = [];

		try {
			// TODO: Improve batch event requests to avoid too many parallel requests
			const chunks = this.chunkArray(eventIds, 10);

			for (const chunk of chunks) {
				if (targetServerName === this.configService.getServerName()) {
					this.logger.info(`Skipping request to self: ${targetServerName}`);
					return [];
				}

				const federationResponses = await Promise.all(
					chunk.map((id) =>
						this.federationService.getEvent(targetServerName, id),
					),
				);

				for (const response of federationResponses) {
					// The Matrix spec defines that federation responses may contain PDUs field
					// which is an array of Persistent Data Units (events)
					if (isFederationEventWithPDUs(response)) {
						eventsToReturn.push(...response.pdus);
					}
				}
			}

			return eventsToReturn;
		} catch (error: unknown) {
			const errorMessage =
				error instanceof Error ? error.message : String(error);
			this.logger.error(
				`Error fetching events from federation: ${errorMessage}`,
			);
			this.logger.debug(
				`Failed federation request details: ${JSON.stringify({ eventIds, targetServerName })}`,
			);
			return eventsToReturn;
		}
	}

	private chunkArray<T>(array: T[], chunkSize: number): T[][] {
		const chunks: T[][] = [];
		for (let i = 0; i < array.length; i += chunkSize) {
			chunks.push(array.slice(i, i + chunkSize));
		}
		return chunks;
	}
}
