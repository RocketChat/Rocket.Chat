import { ServiceClass } from '../../../../apps/meteor/server/sdk/types/ServiceClass';
import type { IOmnichannelTranscriptService } from '../../../../apps/meteor/server/sdk/types/IOmnichannelTranscriptService';

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
