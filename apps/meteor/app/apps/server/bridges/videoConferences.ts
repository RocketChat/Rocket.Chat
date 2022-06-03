import { VideoConferenceBridge } from '@rocket.chat/apps-engine/server/bridges/VideoConferenceBridge';
import { VideoConference } from '@rocket.chat/apps-engine/definition/videoConferences';

import { VideoConf } from '../../../../server/sdk';
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

	protected async update(call: VideoConference, appId: string): Promise<void> {
		this.orch.debugLog(`The App ${appId} is updating a video conference.`);

		if (!call._id || !(await VideoConf.get(call._id))) {
			throw new Error('A video conference must exist to update.');
		}

		const data = this.orch.getConverters()?.get('videoConferences').convertAppVideoConference(call) as VideoConference;
		VideoConf.setProviderData(call._id, data.providerData);
	}
}
