import type { IAppVideoConferencesConverter, AppsVideoConference } from '@rocket.chat/apps';
import { VideoConf } from '@rocket.chat/core-services';
import type { VideoConference } from '@rocket.chat/core-typings';

export class AppVideoConferencesConverter implements IAppVideoConferencesConverter {
	async convertById(callId: string): Promise<AppsVideoConference | undefined> {
		const call = await VideoConf.getUnfiltered(callId);

		return this.convertVideoConference(call);
	}

	convertVideoConference(call: undefined | null): undefined;

	convertVideoConference(call: VideoConference): AppsVideoConference;

	convertVideoConference(call: VideoConference | undefined | null): AppsVideoConference | undefined;

	convertVideoConference(call: VideoConference | undefined | null): AppsVideoConference | undefined {
		if (!call) {
			return;
		}

		return {
			...call,
		} as AppsVideoConference;
	}

	convertAppVideoConference(call: AppsVideoConference): VideoConference {
		return {
			...call,
		} as VideoConference;
	}
}
