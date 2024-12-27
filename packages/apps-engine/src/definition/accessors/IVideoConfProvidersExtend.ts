import type { IVideoConfProvider } from '../videoConfProviders';

/**
 * This accessor provides methods for adding videoconf providers.
 * It is provided during the initialization of your App
 */

export interface IVideoConfProvidersExtend {
    /**
     * Adds a videoconf provider
     *
     * @param provider the provider information
     */
    provideVideoConfProvider(provider: IVideoConfProvider): Promise<void>;
}
