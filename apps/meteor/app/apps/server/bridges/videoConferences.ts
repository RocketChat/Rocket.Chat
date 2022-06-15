import { VideoConferenceBridge } from '@rocket.chat/apps-engine/server/bridges/VideoConferenceBridge';
import { AppVideoConference, VideoConference } from '@rocket.chat/apps-engine/definition/videoConferences';
import { IVideoConfProvider } from '@rocket.chat/apps-engine/definition/videoConfProviders';

import { VideoConf } from '../../../../server/sdk';
import { AppServerOrchestrator } from '../orchestrator';
import { videoConfProviders } from '../../../../server/lib/videoConfProviders';

export class AppVideoConferenceBridge extends VideoConferenceBridge {
	// eslint-disable-next-line no-empty-function
	constructor(private readonly orch: AppServerOrchestrator) {
		super();
	}

	protected async getById(callId: string, appId: string): Promise<VideoConference> {
		this.orch.debugLog(`The App ${appId} is getting the video conference byId: "${callId}"`);

		return this.orch.getConverters()?.get('videoConferences').convertById(callId);
	}

	protected async create(call: AppVideoConference, appId: string): Promise<string> {
		this.orch.debugLog(`The App ${appId} is creating a video conference.`);

		return (
			await VideoConf.create({
				type: 'videoconference',
				...call,
			})
		).callId;
	}

	protected async update(call: VideoConference, appId: string): Promise<void> {
		this.orch.debugLog(`The App ${appId} is updating a video conference.`);

		if (!call._id || !(await VideoConf.get(call._id))) {
			throw new Error('A video conference must exist to update.');
		}

		const data = this.orch.getConverters()?.get('videoConferences').convertAppVideoConference(call) as VideoConference;
		VideoConf.setProviderData(call._id, data.providerData);
	}

	protected async registerProvider(info: IVideoConfProvider): Promise<void> {
		videoConfProviders.registerProvider(info.name);
	}

	protected async unRegisterProvider(info: IVideoConfProvider): Promise<void> {
		videoConfProviders.unRegisterProvider(info.name);
	}
}
