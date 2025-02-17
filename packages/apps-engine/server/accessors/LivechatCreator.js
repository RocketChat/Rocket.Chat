"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LivechatCreator = void 0;
const crypto_1 = require("crypto");
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
        return (0, crypto_1.randomBytes)(16).toString('hex'); // Ensures 128 bits of entropy
    }
}
exports.LivechatCreator = LivechatCreator;
//# sourceMappingURL=LivechatCreator.js.map