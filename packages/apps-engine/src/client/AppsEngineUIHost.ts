import { MESSAGE_ID } from './constants';
import type { IAppsEngineUIResponse, IExternalComponentRoomInfo, IExternalComponentUserInfo } from './definition';
import { AppsEngineUIMethods } from './definition';

type HandleActionData = IExternalComponentUserInfo | IExternalComponentRoomInfo;

/**
 * Represents the host which handles API calls from external components.
 */
export abstract class AppsEngineUIHost {
    /**
     * The message emitter who calling the API.
     */
    private responseDestination!: Window;

    constructor() {
        this.initialize();
    }

    /**
     * initialize the AppClientUIHost by registering window `message` listener
     */
    public initialize() {
        window.addEventListener('message', async ({ data, source }) => {
            if (!data?.hasOwnProperty(MESSAGE_ID)) {
                return;
            }

            this.responseDestination = source as Window;

            const {
                [MESSAGE_ID]: { action, id },
            } = data;

            switch (action) {
                case AppsEngineUIMethods.GET_USER_INFO:
                    this.handleAction(action, id, await this.getClientUserInfo());
                    break;
                case AppsEngineUIMethods.GET_ROOM_INFO:
                    this.handleAction(action, id, await this.getClientRoomInfo());
                    break;
            }
        });
    }

    /**
     * Get the current user's information.
     */
    public abstract getClientUserInfo(): Promise<IExternalComponentUserInfo>;

    /**
     * Get the opened room's information.
     */
    public abstract getClientRoomInfo(): Promise<IExternalComponentRoomInfo>;

    /**
     * Handle the action sent from the external component.
     * @param action the name of the action
     * @param id the unique id of the  API call
     * @param data The data that will return to the caller
     */
    private async handleAction(action: AppsEngineUIMethods, id: string, data: HandleActionData): Promise<void> {
        if (this.responseDestination instanceof MessagePort || this.responseDestination instanceof ServiceWorker) {
            return;
        }

        this.responseDestination.postMessage(
            {
                [MESSAGE_ID]: {
                    id,
                    action,
                    payload: data,
                } as IAppsEngineUIResponse,
            },
            '*',
        );
    }
}
