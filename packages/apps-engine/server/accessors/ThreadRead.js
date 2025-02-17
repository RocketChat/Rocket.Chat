"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ThreadRead = void 0;
class ThreadRead {
    constructor(threadBridge, appId) {
        this.threadBridge = threadBridge;
        this.appId = appId;
    }
    getThreadById(id) {
        return this.threadBridge.doGetById(id, this.appId);
    }
}
exports.ThreadRead = ThreadRead;
//# sourceMappingURL=ThreadRead.js.map