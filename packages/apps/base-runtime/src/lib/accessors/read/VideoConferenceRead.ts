import type { IVideoConferenceRead } from '@rocket.chat/apps-engine/definition/accessors';
import type { VideoConference } from '@rocket.chat/apps-engine/definition/videoConferences';

import { bridgeCall } from '../../bridges/bridgeCall';
import type * as Messenger from '../../messenger';

export class VideoConferenceRead implements IVideoConferenceRead {
	constructor(private readonly senderFn: typeof Messenger.sendRequest) {}

	public getById(id: string): Promise<VideoConference> {
		return bridgeCall<VideoConference>(this.senderFn, 'getVideoConferenceBridge', 'doGetById', id, 'APP_ID');
	}
}
