import type { IVideoConferenceUser } from '@rocket.chat/apps-engine/definition/videoConferences';
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
}
