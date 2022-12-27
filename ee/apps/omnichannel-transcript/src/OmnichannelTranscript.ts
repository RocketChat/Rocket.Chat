import { ServiceClass } from '@rocket.chat/core-services';
import type { IOmnichannelTranscriptService } from '@rocket.chat/core-services';

export class OmnichannelTranscript extends ServiceClass implements IOmnichannelTranscriptService {
	protected name = 'omnichannel-transcript';

	constructor() {
		super();

		// your stuff
	}

	getConfig(): unknown {
		return null;
	}
}
