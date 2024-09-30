import type { IHttp, IModify, IPersistence, IRead } from '../accessors';
import type { IApiEndpointInfo } from './IApiEndpointInfo';
import type { IApiExample } from './IApiExample';
import type { IApiRequest } from './IRequest';
import type { IApiResponse } from './IResponse';

/**
 * Represents an api endpoint that is being provided.
 */
export interface IApiEndpoint {
    /**
     * The last part of the api URL. Example: https://{your-server-address}/api/apps/public/{your-app-id}/{path}
     * or https://{your-server-address}/api/apps/private/{your-app-id}/{private-hash}/{path}
     */
    path: string;
    examples?: { [key: string]: IApiExample };
    /**
     * Whether this endpoint requires an authenticated user to access it.
     *
     * The authentication will be done by the host server using its own
     * authentication system.
     *
     * If no authentication is provided, the request will be automatically
     * rejected with a 401 status code.
     */
    authRequired?: boolean;

    /**
     * The methods that are available for this endpoint.
     * This property is provided by the Runtime and should not be set manually.
     *
     * Its values are used on the Apps-Engine to validate the request method.
     */
    _availableMethods?: string[];

    /**
     * Called whenever the publically accessible url for this App is called,
     * if you handle the methods differently then split it out so your code doesn't get too big.
     */
    get?(request: IApiRequest, endpoint: IApiEndpointInfo, read: IRead, modify: IModify, http: IHttp, persis: IPersistence): Promise<IApiResponse>;
    post?(request: IApiRequest, endpoint: IApiEndpointInfo, read: IRead, modify: IModify, http: IHttp, persis: IPersistence): Promise<IApiResponse>;
    put?(request: IApiRequest, endpoint: IApiEndpointInfo, read: IRead, modify: IModify, http: IHttp, persis: IPersistence): Promise<IApiResponse>;
    delete?(request: IApiRequest, endpoint: IApiEndpointInfo, read: IRead, modify: IModify, http: IHttp, persis: IPersistence): Promise<IApiResponse>;
    head?(request: IApiRequest, endpoint: IApiEndpointInfo, read: IRead, modify: IModify, http: IHttp, persis: IPersistence): Promise<IApiResponse>;
    options?(request: IApiRequest, endpoint: IApiEndpointInfo, read: IRead, modify: IModify, http: IHttp, persis: IPersistence): Promise<IApiResponse>;
    patch?(request: IApiRequest, endpoint: IApiEndpointInfo, read: IRead, modify: IModify, http: IHttp, persis: IPersistence): Promise<IApiResponse>;
}
