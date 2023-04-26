import type { IBlock } from '@rocket.chat/apps-engine/definition/uikit';
import type { IVideoConferenceUser, VideoConference } from '@rocket.chat/apps-engine/definition/videoConferences';
import type { VideoConfData, VideoConfDataExtended, IVideoConferenceOptions } from '@rocket.chat/apps-engine/definition/videoConfProviders';

export interface IAppsVideoManagerService {
	isFullyConfigured(providerName: string): Promise<boolean>;
	generateUrl(providerName: string, call: VideoConfData): Promise<string>;
	customizeUrl(
		providerName: string,
		call: VideoConfDataExtended,
		user?: IVideoConferenceUser,
		options?: IVideoConferenceOptions,
	): Promise<string>;
	onUserJoin(providerName: string, call: VideoConference, user?: IVideoConferenceUser): Promise<void>;
	onNewVideoConference(providerName: string, call: VideoConference): Promise<void>;
	onVideoConferenceChanged(providerName: string, call: VideoConference): Promise<void>;
	getVideoConferenceInfo(providerName: string, call: VideoConference, user?: IVideoConferenceUser): Promise<Array<IBlock> | undefined>;
}
