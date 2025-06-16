import type { MissingEventType } from '../queues/missing-event.queue';
import { MissingEventsQueue } from '../queues/missing-event.queue';
import { injectable, inject } from 'tsyringe';
import { createLogger } from '../utils/logger';

const logger = createLogger('MissingEventService');

@injectable()
export class MissingEventService {
	constructor(@inject('MissingEventsQueue') private readonly missingEventsQueue: MissingEventsQueue) {}

	addEvent(event: MissingEventType) {
		logger.debug(
			`Adding missing event ${event.eventId} to missing events queue`,
		);
		this.missingEventsQueue.enqueue(event);
	}

	addEvents(events: MissingEventType[]) {
		for (const event of events) {
			this.addEvent(event);
		}
	}
}
