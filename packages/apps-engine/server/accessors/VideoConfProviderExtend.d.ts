import type { IVideoConfProvidersExtend } from '../../definition/accessors';
import type { IVideoConfProvider } from '../../definition/videoConfProviders';
import type { AppVideoConfProviderManager } from '../managers/AppVideoConfProviderManager';
export declare class VideoConfProviderExtend implements IVideoConfProvidersExtend {
    private readonly manager;
    private readonly appId;
    constructor(manager: AppVideoConfProviderManager, appId: string);
    provideVideoConfProvider(provider: IVideoConfProvider): Promise<void>;
}
