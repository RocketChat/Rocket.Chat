import { ACTION_ID_LENGTH, MESSAGE_ID } from './constants';
import type { IExternalComponentRoomInfo, IExternalComponentUserInfo } from './definition';
import { AppsEngineUIMethods } from './definition/AppsEngineUIMethods';
import { randomString } from './utils';

/**
 * Represents the SDK provided to the external component.
 */
export class AppsEngineUIClient {
    private listener: (this: Window, ev: MessageEvent) => any;

    private callbacks: Map<string, (response: any) => any>;

    constructor() {
        this.listener = () => console.log('init');
        this.callbacks = new Map();
    }

    /**
     * Get the current user's information.
     *
     * @return the information of the current user.
     */
    public getUserInfo(): Promise<IExternalComponentUserInfo> {
        return this.call(AppsEngineUIMethods.GET_USER_INFO);
    }

    /**
     * Get the current room's information.
     *
     * @return the information of the current room.
     */
    public getRoomInfo(): Promise<IExternalComponentRoomInfo> {
        return this.call(AppsEngineUIMethods.GET_ROOM_INFO);
    }

    /**
     * Initialize the app  SDK for communicating with Rocket.Chat
     */
    public init(): void {
        this.listener = ({ data }) => {
            if (!data?.hasOwnProperty(MESSAGE_ID)) {
                return;
            }

            const {
                [MESSAGE_ID]: { id, payload },
            } = data;

            if (this.callbacks.has(id)) {
                const resolve = this.callbacks.get(id);

                if (typeof resolve === 'function') {
                    resolve(payload);
                }
                this.callbacks.delete(id);
            }
        };
        window.addEventListener('message', this.listener);
    }

    private call(action: string, payload?: any): Promise<any> {
        return new Promise((resolve) => {
            const id = randomString(ACTION_ID_LENGTH);

            window.parent.postMessage({ [MESSAGE_ID]: { action, payload, id } }, '*');
            this.callbacks.set(id, resolve);
        });
    }
}
