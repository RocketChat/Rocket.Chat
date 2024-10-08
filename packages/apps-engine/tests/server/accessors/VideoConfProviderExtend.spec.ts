import { AsyncTest, Expect, Test } from 'alsatian';

import type { IVideoConfProvider } from '../../../src/definition/videoConfProviders';
import { VideoConfProviderExtend } from '../../../src/server/accessors';
import type { AppVideoConfProviderManager } from '../../../src/server/managers';

export class VideoConfProviderExtendAccessorTestFixture {
    @Test()
    public basicVideoConfProviderExtend() {
        Expect(() => new VideoConfProviderExtend({} as AppVideoConfProviderManager, 'testing')).not.toThrow();
    }

    @AsyncTest()
    public async provideProviderToVideoConfProviderExtend(): Promise<void> {
        let providerAdded: IVideoConfProvider | undefined;
        const mockManager: AppVideoConfProviderManager = {
            addProvider(appId: string, provider: IVideoConfProvider) {
                providerAdded = provider;
            },
        } as AppVideoConfProviderManager;

        const se = new VideoConfProviderExtend(mockManager, 'testing');

        const mockProvider: IVideoConfProvider = {
            name: 'test',

            async generateUrl(): Promise<string> {
                return '';
            },
            async customizeUrl(): Promise<string> {
                return '';
            },
        } as IVideoConfProvider;

        await Expect(() => se.provideVideoConfProvider(mockProvider)).not.toThrowAsync();
        Expect(providerAdded).toBe(mockProvider);
    }
}
