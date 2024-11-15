"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UIKitLivechatBlockInteractionContext = exports.UIKitLivechatInteractionContext = void 0;
const UIKitInteractionResponder_1 = require("../UIKitInteractionResponder");
class UIKitLivechatInteractionContext {
    constructor(baseContext) {
        const { appId, actionId, room, visitor, triggerId } = baseContext;
        this.baseContext = { appId, actionId, room, visitor, triggerId };
        this.responder = new UIKitInteractionResponder_1.UIKitInteractionResponder(this.baseContext);
    }
    getInteractionResponder() {
        return this.responder;
    }
}
exports.UIKitLivechatInteractionContext = UIKitLivechatInteractionContext;
class UIKitLivechatBlockInteractionContext extends UIKitLivechatInteractionContext {
    constructor(interactionData) {
        super(interactionData);
        this.interactionData = interactionData;
    }
    getInteractionData() {
        return this.interactionData;
    }
}
exports.UIKitLivechatBlockInteractionContext = UIKitLivechatBlockInteractionContext;
//# sourceMappingURL=UIKitLivechatInteractionContext.js.map