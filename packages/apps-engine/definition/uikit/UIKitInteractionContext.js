"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UIKitActionButtonInteractionContext = exports.UIKitViewCloseInteractionContext = exports.UIKitViewSubmitInteractionContext = exports.UIKitBlockInteractionContext = exports.UIKitInteractionContext = void 0;
const UIKitInteractionResponder_1 = require("./UIKitInteractionResponder");
class UIKitInteractionContext {
    constructor(baseContext) {
        const { appId, actionId, room, user, triggerId, threadId } = baseContext;
        this.baseContext = { appId, actionId, room, user, triggerId, threadId };
        this.responder = new UIKitInteractionResponder_1.UIKitInteractionResponder(this.baseContext);
    }
    getInteractionResponder() {
        return this.responder;
    }
}
exports.UIKitInteractionContext = UIKitInteractionContext;
class UIKitBlockInteractionContext extends UIKitInteractionContext {
    constructor(interactionData) {
        super(interactionData);
        this.interactionData = interactionData;
    }
    getInteractionData() {
        return this.interactionData;
    }
}
exports.UIKitBlockInteractionContext = UIKitBlockInteractionContext;
class UIKitViewSubmitInteractionContext extends UIKitInteractionContext {
    constructor(interactionData) {
        super(interactionData);
        this.interactionData = interactionData;
    }
    getInteractionData() {
        return this.interactionData;
    }
}
exports.UIKitViewSubmitInteractionContext = UIKitViewSubmitInteractionContext;
class UIKitViewCloseInteractionContext extends UIKitInteractionContext {
    constructor(interactionData) {
        super(interactionData);
        this.interactionData = interactionData;
    }
    getInteractionData() {
        return this.interactionData;
    }
}
exports.UIKitViewCloseInteractionContext = UIKitViewCloseInteractionContext;
class UIKitActionButtonInteractionContext extends UIKitInteractionContext {
    constructor(interactionData) {
        super(interactionData);
        this.interactionData = interactionData;
    }
    getInteractionData() {
        return this.interactionData;
    }
}
exports.UIKitActionButtonInteractionContext = UIKitActionButtonInteractionContext;
//# sourceMappingURL=UIKitInteractionContext.js.map