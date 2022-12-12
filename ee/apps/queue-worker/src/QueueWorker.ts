import { ServiceClass } from '../../../../apps/meteor/server/sdk/types/ServiceClass';
import type { IQueueWorkerService } from '../../../../apps/meteor/server/sdk/types/IQueueWorkerService';

export class QueueWorker extends ServiceClass implements IQueueWorkerService {
	protected name = 'queue-worker';

	constructor() {
		super();

		// your stuff
	}

	getConfig(): unknown {
		return null;
	}

	// more stuff
}
