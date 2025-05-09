import type { IBlock } from '../../definition/uikit';
import type { IVideoConferenceOptions, IVideoConfProvider, VideoConfData, VideoConfDataExtended } from '../../definition/videoConfProviders';
import type { VideoConference } from '../../definition/videoConferences';
import type { IVideoConferenceUser } from '../../definition/videoConferences/IVideoConferenceUser';
import type { AppManager } from '../AppManager';
import type { VideoConferenceBridge } from '../bridges';
import { VideoConfProviderAlreadyExistsError, VideoConfProviderNotRegisteredError } from '../errors';
import type { AppAccessorManager } from './AppAccessorManager';
import { AppPermissionManager } from './AppPermissionManager';
import { AppVideoConfProvider } from './AppVideoConfProvider';
import { PermissionDeniedError } from '../errors/PermissionDeniedError';
import { AppPermissions } from '../permissions/AppPermissions';

export class AppVideoConfProviderManager {
    private readonly accessors: AppAccessorManager;

    private readonly bridge: VideoConferenceBridge;

    private videoConfProviders: Map<string, Map<string, AppVideoConfProvider>>;

    private providerApps: Map<IVideoConfProvider['name'], string>;

    constructor(private readonly manager: AppManager) {
        this.bridge = this.manager.getBridges().getVideoConferenceBridge();
        this.accessors = this.manager.getAccessorManager();

        this.videoConfProviders = new Map<string, Map<string, AppVideoConfProvider>>();
        this.providerApps = new Map<string, string>();
    }

    public canProviderBeTouchedBy(appId: string, providerName: string): boolean {
        const key = providerName.toLowerCase().trim();
        return (key && (!this.providerApps.has(key) || this.providerApps.get(key) === appId)) || false;
    }

    public isAlreadyDefined(providerName: string): boolean {
        const search = providerName.toLowerCase().trim();

        for (const [, providers] of this.videoConfProviders) {
            if (providers.has(search)) {
                return true;
            }
        }

        return false;
    }

    public addProvider(appId: string, provider: IVideoConfProvider): void {
        const app = this.manager.getOneById(appId);
        if (!app) {
            throw new Error('App must exist in order for a video conference provider to be added.');
        }

        if (!AppPermissionManager.hasPermission(appId, AppPermissions.videoConference.provider)) {
            throw new PermissionDeniedError({
                appId,
                missingPermissions: [AppPermissions.videoConference.provider],
            });
        }

        const providerName = provider.name.toLowerCase().trim();
        if (!this.canProviderBeTouchedBy(appId, providerName)) {
            throw new VideoConfProviderAlreadyExistsError(provider.name);
        }

        if (!this.videoConfProviders.has(appId)) {
            this.videoConfProviders.set(appId, new Map<string, AppVideoConfProvider>());
        }

        this.videoConfProviders.get(appId)!.set(providerName, new AppVideoConfProvider(app, provider));
        this.linkAppProvider(appId, providerName);
    }

    public registerProviders(appId: string): void {
        if (!this.videoConfProviders.has(appId)) {
            return;
        }

        const appProviders = this.videoConfProviders.get(appId);
        if (!appProviders) {
            return;
        }

        for (const [, providerInfo] of appProviders) {
            this.registerProvider(appId, providerInfo);
        }
    }

    public unregisterProviders(appId: string): void {
        if (!this.videoConfProviders.has(appId)) {
            return;
        }

        const appProviders = this.videoConfProviders.get(appId)!;
        for (const [, providerInfo] of appProviders) {
            this.unregisterProvider(appId, providerInfo);
        }

        this.videoConfProviders.delete(appId);
    }

    public async isFullyConfigured(providerName: string): Promise<boolean> {
        const providerInfo = this.retrieveProviderInfo(providerName);
        if (!providerInfo) {
            throw new VideoConfProviderNotRegisteredError(providerName);
        }

        return providerInfo.runIsFullyConfigured(this.manager.getLogStorage(), this.accessors);
    }

    public async onNewVideoConference(providerName: string, call: VideoConference): Promise<void> {
        const providerInfo = this.retrieveProviderInfo(providerName);
        if (!providerInfo) {
            throw new VideoConfProviderNotRegisteredError(providerName);
        }

        return providerInfo.runOnNewVideoConference(call, this.manager.getLogStorage(), this.accessors);
    }

    public async onVideoConferenceChanged(providerName: string, call: VideoConference): Promise<void> {
        const providerInfo = this.retrieveProviderInfo(providerName);
        if (!providerInfo) {
            throw new VideoConfProviderNotRegisteredError(providerName);
        }

        return providerInfo.runOnVideoConferenceChanged(call, this.manager.getLogStorage(), this.accessors);
    }

    public async onUserJoin(providerName: string, call: VideoConference, user?: IVideoConferenceUser): Promise<void> {
        const providerInfo = this.retrieveProviderInfo(providerName);
        if (!providerInfo) {
            throw new VideoConfProviderNotRegisteredError(providerName);
        }

        return providerInfo.runOnUserJoin(call, user, this.manager.getLogStorage(), this.accessors);
    }

    public async getVideoConferenceInfo(providerName: string, call: VideoConference, user?: IVideoConferenceUser): Promise<Array<IBlock> | undefined> {
        const providerInfo = this.retrieveProviderInfo(providerName);
        if (!providerInfo) {
            throw new VideoConfProviderNotRegisteredError(providerName);
        }

        return providerInfo.runGetVideoConferenceInfo(call, user, this.manager.getLogStorage(), this.accessors);
    }

    public async generateUrl(providerName: string, call: VideoConfData): Promise<string> {
        const providerInfo = this.retrieveProviderInfo(providerName);
        if (!providerInfo) {
            throw new VideoConfProviderNotRegisteredError(providerName);
        }

        return providerInfo.runGenerateUrl(call, this.manager.getLogStorage(), this.accessors);
    }

    public async customizeUrl(
        providerName: string,
        call: VideoConfDataExtended,
        user?: IVideoConferenceUser,
        options?: IVideoConferenceOptions,
    ): Promise<string> {
        const providerInfo = this.retrieveProviderInfo(providerName);
        if (!providerInfo) {
            throw new VideoConfProviderNotRegisteredError(providerName);
        }

        return providerInfo.runCustomizeUrl(call, user, options, this.manager.getLogStorage(), this.accessors);
    }

    private retrieveProviderInfo(providerName: string): AppVideoConfProvider | undefined {
        const key = providerName.toLowerCase().trim();

        for (const [, providers] of this.videoConfProviders) {
            if (!providers.has(key)) {
                continue;
            }

            const provider = providers.get(key)!;
            if (provider.isRegistered) {
                return provider;
            }
        }
    }

    private linkAppProvider(appId: string, providerName: string): void {
        this.providerApps.set(providerName, appId);
    }

    private registerProvider(appId: string, info: AppVideoConfProvider): void {
        this.bridge.doRegisterProvider(info.provider, appId);
        info.hasBeenRegistered();
    }

    private unregisterProvider(appId: string, info: AppVideoConfProvider): void {
        const key = info.provider.name.toLowerCase().trim();

        this.bridge.doUnRegisterProvider(info.provider, appId);
        this.providerApps.delete(key);

        info.isRegistered = false;

        const map = this.videoConfProviders.get(appId);
        if (map) {
            map.delete(key);
        }
    }
}
