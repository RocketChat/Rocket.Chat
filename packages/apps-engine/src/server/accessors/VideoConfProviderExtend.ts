import type { IVideoConfProvidersExtend } from '../../definition/accessors';
import type { IVideoConfProvider } from '../../definition/videoConfProviders';
import type { AppVideoConfProviderManager } from '../managers/AppVideoConfProviderManager';

export class VideoConfProviderExtend implements IVideoConfProvidersExtend {
    constructor(private readonly manager: AppVideoConfProviderManager, private readonly appId: string) {}

    public provideVideoConfProvider(provider: IVideoConfProvider): Promise<void> {
        return Promise.resolve(this.manager.addProvider(this.appId, provider));
    }
}
