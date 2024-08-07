import type { IApi } from '../api';

/**
 * This accessor provides methods for adding a custom api.
 * It is provided during the initialization of your App
 */

export interface IApiExtend {
    /**
     * Adds an api which can be called by external services lateron.
     * Should an api already exists an error will be thrown.
     *
     * @param api the command information
     */
    provideApi(api: IApi): Promise<void>;
}
