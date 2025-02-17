import type { IExternalComponentRoomInfo, IExternalComponentUserInfo } from './definition';
/**
 * Represents the SDK provided to the external component.
 */
export declare class AppsEngineUIClient {
    private listener;
    private callbacks;
    constructor();
    /**
     * Get the current user's information.
     *
     * @return the information of the current user.
     */
    getUserInfo(): Promise<IExternalComponentUserInfo>;
    /**
     * Get the current room's information.
     *
     * @return the information of the current room.
     */
    getRoomInfo(): Promise<IExternalComponentRoomInfo>;
    /**
     * Initialize the app  SDK for communicating with Rocket.Chat
     */
    init(): void;
    private call;
}
