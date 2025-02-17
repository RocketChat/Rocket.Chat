"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppsEngineUIClient = void 0;
const constants_1 = require("./constants");
const AppsEngineUIMethods_1 = require("./definition/AppsEngineUIMethods");
const utils_1 = require("./utils");
/**
 * Represents the SDK provided to the external component.
 */
class AppsEngineUIClient {
    constructor() {
        this.listener = () => console.log('init');
        this.callbacks = new Map();
    }
    /**
     * Get the current user's information.
     *
     * @return the information of the current user.
     */
    getUserInfo() {
        return this.call(AppsEngineUIMethods_1.AppsEngineUIMethods.GET_USER_INFO);
    }
    /**
     * Get the current room's information.
     *
     * @return the information of the current room.
     */
    getRoomInfo() {
        return this.call(AppsEngineUIMethods_1.AppsEngineUIMethods.GET_ROOM_INFO);
    }
    /**
     * Initialize the app  SDK for communicating with Rocket.Chat
     */
    init() {
        this.listener = ({ data }) => {
            if (!(data === null || data === void 0 ? void 0 : data.hasOwnProperty(constants_1.MESSAGE_ID))) {
                return;
            }
            const { [constants_1.MESSAGE_ID]: { id, payload }, } = data;
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
    call(action, payload) {
        return new Promise((resolve) => {
            const id = (0, utils_1.randomString)(constants_1.ACTION_ID_LENGTH);
            window.parent.postMessage({ [constants_1.MESSAGE_ID]: { action, payload, id } }, '*');
            this.callbacks.set(id, resolve);
        });
    }
}
exports.AppsEngineUIClient = AppsEngineUIClient;
//# sourceMappingURL=AppsEngineUIClient.js.map