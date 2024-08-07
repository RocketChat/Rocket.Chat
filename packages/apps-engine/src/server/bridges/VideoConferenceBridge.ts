import type { IVideoConfProvider } from '../../definition/videoConfProviders';
import type { AppVideoConference } from '../../definition/videoConferences/AppVideoConference';
import type { VideoConference } from '../../definition/videoConferences/IVideoConference';
import { PermissionDeniedError } from '../errors/PermissionDeniedError';
import { AppPermissionManager } from '../managers/AppPermissionManager';
import { AppPermissions } from '../permissions/AppPermissions';
import { BaseBridge } from './BaseBridge';

export abstract class VideoConferenceBridge extends BaseBridge {
    public async doGetById(callId: string, appId: string): Promise<VideoConference> {
        if (this.hasReadPermission(appId)) {
            return this.getById(callId, appId);
        }
    }

    public async doCreate(call: AppVideoConference, appId: string): Promise<string> {
        if (this.hasWritePermission(appId)) {
            return this.create(call, appId);
        }
    }

    public async doUpdate(call: VideoConference, appId: string): Promise<void> {
        if (this.hasWritePermission(appId)) {
            return this.update(call, appId);
        }
    }

    public async doRegisterProvider(info: IVideoConfProvider, appId: string): Promise<void> {
        if (this.hasProviderPermission(appId)) {
            return this.registerProvider(info, appId);
        }
    }

    public async doUnRegisterProvider(info: IVideoConfProvider, appId: string): Promise<void> {
        if (this.hasProviderPermission(appId)) {
            return this.unRegisterProvider(info, appId);
        }
    }

    protected abstract create(call: AppVideoConference, appId: string): Promise<string>;

    protected abstract getById(callId: string, appId: string): Promise<VideoConference>;

    protected abstract update(call: VideoConference, appId: string): Promise<void>;

    protected abstract registerProvider(info: IVideoConfProvider, appId: string): Promise<void>;

    protected abstract unRegisterProvider(info: IVideoConfProvider, appId: string): Promise<void>;

    private hasWritePermission(appId: string): boolean {
        if (AppPermissionManager.hasPermission(appId, AppPermissions.videoConference.write)) {
            return true;
        }

        AppPermissionManager.notifyAboutError(
            new PermissionDeniedError({
                appId,
                missingPermissions: [AppPermissions.videoConference.write],
            }),
        );

        return false;
    }

    private hasReadPermission(appId: string): boolean {
        if (AppPermissionManager.hasPermission(appId, AppPermissions.videoConference.read)) {
            return true;
        }

        AppPermissionManager.notifyAboutError(
            new PermissionDeniedError({
                appId,
                missingPermissions: [AppPermissions.videoConference.read],
            }),
        );

        return false;
    }

    private hasProviderPermission(appId: string): boolean {
        if (AppPermissionManager.hasPermission(appId, AppPermissions.videoConference.provider)) {
            return true;
        }

        AppPermissionManager.notifyAboutError(
            new PermissionDeniedError({
                appId,
                missingPermissions: [AppPermissions.videoConference.provider],
            }),
        );

        return false;
    }
}
