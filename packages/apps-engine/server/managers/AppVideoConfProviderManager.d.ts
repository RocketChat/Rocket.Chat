import type { IBlock } from '../../definition/uikit';
import type { IVideoConferenceOptions, IVideoConfProvider, VideoConfData, VideoConfDataExtended } from '../../definition/videoConfProviders';
import type { VideoConference } from '../../definition/videoConferences';
import type { IVideoConferenceUser } from '../../definition/videoConferences/IVideoConferenceUser';
import type { AppManager } from '../AppManager';
export declare class AppVideoConfProviderManager {
    private readonly manager;
    private readonly accessors;
    private readonly bridge;
    private videoConfProviders;
    private providerApps;
    constructor(manager: AppManager);
    canProviderBeTouchedBy(appId: string, providerName: string): boolean;
    isAlreadyDefined(providerName: string): boolean;
    addProvider(appId: string, provider: IVideoConfProvider): void;
    registerProviders(appId: string): void;
    unregisterProviders(appId: string): void;
    isFullyConfigured(providerName: string): Promise<boolean>;
    onNewVideoConference(providerName: string, call: VideoConference): Promise<void>;
    onVideoConferenceChanged(providerName: string, call: VideoConference): Promise<void>;
    onUserJoin(providerName: string, call: VideoConference, user?: IVideoConferenceUser): Promise<void>;
    getVideoConferenceInfo(providerName: string, call: VideoConference, user?: IVideoConferenceUser): Promise<Array<IBlock> | undefined>;
    generateUrl(providerName: string, call: VideoConfData): Promise<string>;
    customizeUrl(providerName: string, call: VideoConfDataExtended, user?: IVideoConferenceUser, options?: IVideoConferenceOptions): Promise<string>;
    private retrieveProviderInfo;
    private linkAppProvider;
    private registerProvider;
    private unregisterProvider;
}
