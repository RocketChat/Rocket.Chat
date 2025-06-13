import { injectable } from 'tsyringe';
import type { StagingAreaEventType } from '../queues/staging-area.queue';
import { StagingAreaQueue } from '../queues/staging-area.queue';
import { StagingAreaService } from '../services/staging-area.service';
import { createLogger } from '../utils/logger';

@injectable()
export class StagingAreaListener {
	private readonly logger = createLogger('StagingAreaListener');

	constructor(
		private readonly stagingAreaQueue: StagingAreaQueue,
		private readonly stagingAreaService: StagingAreaService,
	) {
		this.stagingAreaQueue.registerHandler(this.handleQueueItem.bind(this));
	}

	async handleQueueItem(data: StagingAreaEventType) {
		this.logger.debug(`Processing event ${data.eventId} from ${data.origin}`);
		await this.stagingAreaService.processEvent(data);
	}
}
