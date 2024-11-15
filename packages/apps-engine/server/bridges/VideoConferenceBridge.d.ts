import { BaseBridge } from './BaseBridge';
import type { IVideoConfProvider } from '../../definition/videoConfProviders';
import type { AppVideoConference } from '../../definition/videoConferences/AppVideoConference';
import type { VideoConference } from '../../definition/videoConferences/IVideoConference';
export declare abstract class VideoConferenceBridge extends BaseBridge {
    doGetById(callId: string, appId: string): Promise<VideoConference>;
    doCreate(call: AppVideoConference, appId: string): Promise<string>;
    doUpdate(call: VideoConference, appId: string): Promise<void>;
    doRegisterProvider(info: IVideoConfProvider, appId: string): Promise<void>;
    doUnRegisterProvider(info: IVideoConfProvider, appId: string): Promise<void>;
    protected abstract create(call: AppVideoConference, appId: string): Promise<string>;
    protected abstract getById(callId: string, appId: string): Promise<VideoConference>;
    protected abstract update(call: VideoConference, appId: string): Promise<void>;
    protected abstract registerProvider(info: IVideoConfProvider, appId: string): Promise<void>;
    protected abstract unRegisterProvider(info: IVideoConfProvider, appId: string): Promise<void>;
    private hasWritePermission;
    private hasReadPermission;
    private hasProviderPermission;
}
