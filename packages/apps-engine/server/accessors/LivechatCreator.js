"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LivechatCreator = void 0;
class LivechatCreator {
    constructor(bridges, appId) {
        this.bridges = bridges;
        this.appId = appId;
    }
    createRoom(visitor, agent, extraParams) {
        return this.bridges.getLivechatBridge().doCreateRoom(visitor, agent, this.appId, extraParams);
    }
    /**
     * @deprecated Use `createAndReturnVisitor` instead.
     */
    createVisitor(visitor) {
        return this.bridges.getLivechatBridge().doCreateVisitor(visitor, this.appId);
    }
    createAndReturnVisitor(visitor) {
        return this.bridges.getLivechatBridge().doCreateAndReturnVisitor(visitor, this.appId);
    }
    createToken() {
        return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    }
}
exports.LivechatCreator = LivechatCreator;
//# sourceMappingURL=LivechatCreator.js.map