import type { IVideoConference as IAppVideoConference } from '@rocket.chat/apps-engine/definition/videoConferences';
import type { IVideoConference } from '@rocket.chat/core-typings';

import { VideoConf } from '../../../../server/sdk';

export class AppVideoConferencesConverter {
	async convertById(callId: string): Promise<IAppVideoConference | undefined> {
		const call = await VideoConf.get(callId);

		return this.convertVideoConference(call);
	}

	convertVideoConference(call: IVideoConference | null): IAppVideoConference | undefined {
		if (!call) {
			return;
		}

		return {
			...call,
		} as IAppVideoConference;
	}
}
