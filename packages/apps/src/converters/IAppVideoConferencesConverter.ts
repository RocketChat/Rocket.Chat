import type { VideoConference } from '@rocket.chat/core-typings';

import type { AppsVideoConference } from '../AppsEngine';

export interface IAppVideoConferencesConverter {
	convertById(videoConferenceId: VideoConference['_id']): Promise<AppsVideoConference | undefined>;
	convertVideoConference(videoConference: undefined | null): undefined;
	convertVideoConference(videoConference: VideoConference): AppsVideoConference;
	convertVideoConference(videoConference: VideoConference | undefined | null): AppsVideoConference | undefined;
	convertAppVideoConference(videoConference: AppsVideoConference): VideoConference;
}
