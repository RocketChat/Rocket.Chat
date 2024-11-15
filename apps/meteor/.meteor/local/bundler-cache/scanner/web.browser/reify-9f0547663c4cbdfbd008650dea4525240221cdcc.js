"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppsEngineUIHost = void 0;
const constants_1 = require("./constants");
const definition_1 = require("./definition");
/**
 * Represents the host which handles API calls from external components.
 */
class AppsEngineUIHost {
    constructor() {
        this.initialize();
    }
    /**
     * initialize the AppClientUIHost by registering window `message` listener
     */
    initialize() {
        window.addEventListener('message', ({ data, source }) => __awaiter(this, void 0, void 0, function* () {
            if (!(data === null || data === void 0 ? void 0 : data.hasOwnProperty(constants_1.MESSAGE_ID))) {
                return;
            }
            this.responseDestination = source;
            const { [constants_1.MESSAGE_ID]: { action, id }, } = data;
            switch (action) {
                case definition_1.AppsEngineUIMethods.GET_USER_INFO:
                    this.handleAction(action, id, yield this.getClientUserInfo());
                    break;
                case definition_1.AppsEngineUIMethods.GET_ROOM_INFO:
                    this.handleAction(action, id, yield this.getClientRoomInfo());
                    break;
            }
        }));
    }
    /**
     * Handle the action sent from the external component.
     * @param action the name of the action
     * @param id the unique id of the  API call
     * @param data The data that will return to the caller
     */
    handleAction(action, id, data) {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.responseDestination instanceof MessagePort || this.responseDestination instanceof ServiceWorker) {
                return;
            }
            this.responseDestination.postMessage({
                [constants_1.MESSAGE_ID]: {
                    id,
                    action,
                    payload: data,
                },
            }, '*');
        });
    }
}
exports.AppsEngineUIHost = AppsEngineUIHost;
//# sourceMappingURL=AppsEngineUIHost.js.map