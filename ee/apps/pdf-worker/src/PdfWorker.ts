import { ServiceClass } from '@rocket.chat/core-services';
import type { IPDFWorkerService } from '@rocket.chat/core-services';

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
