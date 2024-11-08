import type { IExternalComponentRoomInfo, IExternalComponentUserInfo } from './index';

/**
 * The response to the AppClientSDK's API call.
 */
export interface IAppsEngineUIResponse {
    /**
     * The name of the action
     */
    action: string;
    /**
     * The unique id of the API call
     */
    id: string;
    /**
     * The data that will return to the caller
     */
    payload: IExternalComponentUserInfo | IExternalComponentRoomInfo;
}
