import type { IVideoConferenceRead } from '@rocket.chat/apps-engine/definition/accessors/index.js';
import type { VideoConference } from '@rocket.chat/apps-engine/definition/videoConferences/index.js';

import { bridgeCall } from '../../bridges/bridgeCall.js';
import type * as Messenger from '../../messenger.js';

export class VideoConferenceRead implements IVideoConferenceRead {
	constructor(private readonly senderFn: typeof Messenger.sendRequest) {}

	public getById(id: string): Promise<VideoConference> {
		return bridgeCall<VideoConference>(this.senderFn, 'getVideoConferenceBridge', 'doGetById', id, 'APP_ID');
	}
}
