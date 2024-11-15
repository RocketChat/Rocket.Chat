import type { IBlock } from '../../definition/uikit';
import type { IVideoConferenceOptions, IVideoConfProvider, VideoConfData, VideoConfDataExtended } from '../../definition/videoConfProviders';
import type { VideoConference } from '../../definition/videoConferences';
import type { IVideoConferenceUser } from '../../definition/videoConferences/IVideoConferenceUser';
import type { ProxiedApp } from '../ProxiedApp';
import type { AppLogStorage } from '../storage';
import type { AppAccessorManager } from './AppAccessorManager';
export declare class AppVideoConfProvider {
    app: ProxiedApp;
    provider: IVideoConfProvider;
    /**
     * States whether this provider has been registered into the Rocket.Chat system or not.
     */
    isRegistered: boolean;
    constructor(app: ProxiedApp, provider: IVideoConfProvider);
    hasBeenRegistered(): void;
    runIsFullyConfigured(logStorage: AppLogStorage, accessors: AppAccessorManager): Promise<boolean>;
    runGenerateUrl(call: VideoConfData, logStorage: AppLogStorage, accessors: AppAccessorManager): Promise<string>;
    runCustomizeUrl(call: VideoConfDataExtended, user: IVideoConferenceUser | undefined, options: IVideoConferenceOptions, logStorage: AppLogStorage, accessors: AppAccessorManager): Promise<string>;
    runOnNewVideoConference(call: VideoConference, logStorage: AppLogStorage, accessors: AppAccessorManager): Promise<void>;
    runOnVideoConferenceChanged(call: VideoConference, logStorage: AppLogStorage, accessors: AppAccessorManager): Promise<void>;
    runOnUserJoin(call: VideoConference, user: IVideoConferenceUser | undefined, logStorage: AppLogStorage, accessors: AppAccessorManager): Promise<void>;
    runGetVideoConferenceInfo(call: VideoConference, user: IVideoConferenceUser | undefined, logStorage: AppLogStorage, accessors: AppAccessorManager): Promise<Array<IBlock> | undefined>;
    private runTheCode;
}
