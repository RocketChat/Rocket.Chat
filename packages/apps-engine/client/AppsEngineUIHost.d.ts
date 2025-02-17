import type { IExternalComponentRoomInfo, IExternalComponentUserInfo } from './definition';
/**
 * Represents the host which handles API calls from external components.
 */
export declare abstract class AppsEngineUIHost {
    /**
     * The message emitter who calling the API.
     */
    private responseDestination;
    constructor();
    /**
     * initialize the AppClientUIHost by registering window `message` listener
     */
    initialize(): void;
    /**
     * Get the current user's information.
     */
    abstract getClientUserInfo(): Promise<IExternalComponentUserInfo>;
    /**
     * Get the opened room's information.
     */
    abstract getClientRoomInfo(): Promise<IExternalComponentRoomInfo>;
    /**
     * Handle the action sent from the external component.
     * @param action the name of the action
     * @param id the unique id of the  API call
     * @param data The data that will return to the caller
     */
    private handleAction;
}
