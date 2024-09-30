import type { IApiEndpoint } from './IApiEndpoint';

/**
 * Represents an api that is being provided.
 */
export interface IApi {
    /**
     * Provides the visibility method of the URL, see the ApiVisibility descriptions for more information
     */
    visibility: ApiVisibility;
    /**
     * Provides the visibility method of the URL, see the ApiSecurity descriptions for more information
     */
    security: ApiSecurity;
    /**
     * Provide enpoints for this api registry
     */
    endpoints: Array<IApiEndpoint>;
}

export enum ApiVisibility {
    /**
     * A public Api has a fixed format for a url. Using it enables an
     * easy to remember structure, however, it also means the url is
     * intelligently guessed. As a result, we recommend having some
     * sort of security setup if you must have a public api.Whether
     * you use the provided security, ApiSecurity, or implement your own.
     * Url format:
     * `https://{your-server-address}/api/apps/public/{your-app-id}/{path}`
     */
    PUBLIC,
    /**
     * Private Api's contain a random value in the url format,
     * making them harder go guess by default. The random value
     * will be generated whenever the App is installed on a server.
     * This means that the URL will not be the same on any server,
     * but will remain the same throughout the lifecycle of an App
     * including updates. As a result, if a user uninstalls the App
     * and reinstalls the App, then the random value will change.
     * Url format:
     * `https://{your-server-address}/api/apps/private/{your-app-id}/{random-hash}/{path}`
     */
    PRIVATE,
}

export enum ApiSecurity {
    /**
     * No security check will be executed agains the calls made to this URL
     */
    UNSECURE,
    /**
     * Only calls containing a valid token will be able to execute the api
     * Mutiple tokens can be generated to access the api, by default one
     * will be generated automatically.
     * @param `X-Auth-Token`
     */
    // CHECKSUM_SECRET,
}
