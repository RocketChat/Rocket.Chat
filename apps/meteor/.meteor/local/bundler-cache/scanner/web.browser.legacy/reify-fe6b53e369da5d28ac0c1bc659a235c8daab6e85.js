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
exports.AppClientManager = void 0;
const AppServerCommunicator_1 = require("./AppServerCommunicator");
const AppsEngineUIHost_1 = require("./AppsEngineUIHost");
class AppClientManager {
    constructor(appsEngineUIHost, communicator) {
        this.appsEngineUIHost = appsEngineUIHost;
        this.communicator = communicator;
        if (!(appsEngineUIHost instanceof AppsEngineUIHost_1.AppsEngineUIHost)) {
            throw new Error('The appClientUIHost must extend appClientUIHost');
        }
        if (communicator && !(communicator instanceof AppServerCommunicator_1.AppServerCommunicator)) {
            throw new Error('The communicator must extend AppServerCommunicator');
        }
        this.apps = [];
    }
    load() {
        return __awaiter(this, void 0, void 0, function* () {
            this.apps = yield this.communicator.getEnabledApps();
            console.log('Enabled apps:', this.apps);
        });
    }
    initialize() {
        return __awaiter(this, void 0, void 0, function* () {
            this.appsEngineUIHost.initialize();
        });
    }
}
exports.AppClientManager = AppClientManager;
//# sourceMappingURL=AppClientManager.js.map