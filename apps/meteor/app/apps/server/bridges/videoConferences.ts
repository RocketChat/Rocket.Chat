import { VideoConferenceBridge } from '@rocket.chat/apps-engine/server/bridges/VideoConferenceBridge';
import { VideoConference } from '@rocket.chat/apps-engine/definition/videoConferences';

import { AppServerOrchestrator } from '../orchestrator';

export class AppVideoConferenceBridge extends VideoConferenceBridge {
	// eslint-disable-next-line no-empty-function
	constructor(private readonly orch: AppServerOrchestrator) {
		super();
	}

	protected async getById(callId: string, appId: string): Promise<VideoConference> {
		this.orch.debugLog(`The App ${appId} is getting the video conference byId: "${callId}"`);

		return this.orch.getConverters()?.get('videoConferences').convertById(callId);
	}
}
