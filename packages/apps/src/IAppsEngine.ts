import type { AppStatus } from '@rocket.chat/apps-engine/definition/AppStatus';
import type { IAppInfo } from '@rocket.chat/apps-engine/definition/metadata';
import type { IOutboundMessage, ProviderMetadata, ValidOutboundProvider } from '@rocket.chat/apps-engine/definition/outboundCommunication';
import type { IBlock } from '@rocket.chat/apps-engine/definition/uikit';
import type { IVideoConferenceOptions, VideoConfData, VideoConfDataExtended } from '@rocket.chat/apps-engine/definition/videoConfProviders';
import type { VideoConference } from '@rocket.chat/apps-engine/definition/videoConferences';
import type { IVideoConferenceUser } from '@rocket.chat/apps-engine/definition/videoConferences/IVideoConferenceUser';

import type { AppEvents } from './AppsEngine';
import type { IGetAppsFilter } from './server/IGetAppsFilter';
import type { IAppStorageItem } from './server/storage';

export type AppStatusReport = {
	[appId: string]: { instanceId: string; isLocal: boolean; status: AppStatus }[];
};

export interface IAppsVideoConfProviders {
	isFullyConfigured(providerName: string): Promise<boolean>;
	getVideoConferenceInfo(providerName: string, call: VideoConference, user?: IVideoConferenceUser): Promise<Array<IBlock> | undefined>;
	generateUrl(providerName: string, call: VideoConfData): Promise<string>;
	customizeUrl(
		providerName: string,
		call: VideoConfDataExtended,
		user?: IVideoConferenceUser,
		options?: IVideoConferenceOptions,
	): Promise<string>;
	onNewVideoConference(providerName: string, call: VideoConference): Promise<void>;
	onVideoConferenceChanged(providerName: string, call: VideoConference): Promise<void>;
	onUserJoin(providerName: string, call: VideoConference, user?: IVideoConferenceUser): Promise<void>;
}

export interface IAppsOutboundProviders {
	getProviderMetadata(appId: string, type: ValidOutboundProvider): Promise<ProviderMetadata>;
	sendOutboundMessage(appId: string, type: ValidOutboundProvider, message: IOutboundMessage): Promise<void>;
}

export interface IAppsEngine {
	// lifecycle / status
	isLoaded(): boolean;
	isInitialized(): boolean;

	// hook dispatch — returns undefined when not loaded (passthrough preserved).
	// `Promise<any>` mirrors the orchestrator contract: hook results flow straight
	// back to callers that merge them into typed payloads (`result ?? original`).
	triggerEvent(event: AppEvents, ...payload: unknown[]): Promise<any>;

	// ex-core-services query surface (was IAppsEngineService)
	getApps(query: IGetAppsFilter): Promise<IAppInfo[] | undefined>;
	getAppStorageItemById(appId: string): Promise<IAppStorageItem | undefined>;
	getAppsStatusLocal(): Promise<{ appId: string; status: AppStatus }[]>;
	getAppsStatusInNodes(): Promise<AppStatusReport>;

	// serializable replacements for the live-object escapes
	videoConfProviders: IAppsVideoConfProviders;
	outboundProviders: IAppsOutboundProviders;
}
