import { MissingEventsQueue } from './missing-event.queue';
import { StagingAreaQueue } from './staging-area.queue';

const QUEUES = [MissingEventsQueue, StagingAreaQueue];

export class QueueModule {
	providers = [...QUEUES];
	exports = [...QUEUES];
}
