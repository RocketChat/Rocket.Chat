import { ServiceClass } from '../../../../apps/meteor/server/sdk/types/ServiceClass';
import type { IPDFWorkerService } from '../../../../apps/meteor/server/sdk/types/IPDFWorkerService';

export class PdfWorker extends ServiceClass implements IPDFWorkerService {
	protected name = 'pdf-worker';

	constructor() {
		super();

		// your stuff
	}

	// more stuff
	getConfig(): unknown {
		return null;
	}
}
