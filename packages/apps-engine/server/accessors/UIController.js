"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UIController = void 0;
const uikit_1 = require("../../definition/uikit");
const UIKitInteractionPayloadFormatter_1 = require("../../definition/uikit/UIKitInteractionPayloadFormatter");
const UIHelper_1 = require("../misc/UIHelper");
class UIController {
    constructor(appId, bridges) {
        this.appId = appId;
        this.uiInteractionBridge = bridges.getUiInteractionBridge();
    }
    /**
     * @deprecated please prefer the `openSurfaceView` method
     */
    openModalView(view, context, user) {
        return this.openModal(view, context, user);
    }
    /**
     * @deprecated please prefer the `updateSurfaceView` method
     */
    updateModalView(view, context, user) {
        return this.openModal(view, context, user, true);
    }
    /**
     * @deprecated please prefer the `openSurfaceView` method
     */
    openContextualBarView(view, context, user) {
        return this.openContextualBar(view, context, user);
    }
    /**
     * @deprecated please prefer the `updateSurfaceView` method
     */
    updateContextualBarView(view, context, user) {
        return this.openContextualBar(view, context, user, true);
    }
    openSurfaceView(view, context, user) {
        const blocks = UIHelper_1.UIHelper.assignIds(view.blocks, this.appId);
        const viewWithIds = Object.assign(Object.assign({}, view), { blocks });
        switch (view.type) {
            case uikit_1.UIKitSurfaceType.CONTEXTUAL_BAR:
                return this.openContextualBar(viewWithIds, context, user);
            case uikit_1.UIKitSurfaceType.MODAL:
                return this.openModal(viewWithIds, context, user);
        }
    }
    updateSurfaceView(view, context, user) {
        const blocks = UIHelper_1.UIHelper.assignIds(view.blocks, this.appId);
        const viewWithIds = Object.assign(Object.assign({}, view), { blocks });
        switch (view.type) {
            case uikit_1.UIKitSurfaceType.CONTEXTUAL_BAR:
                return this.openContextualBar(viewWithIds, context, user, true);
            case uikit_1.UIKitSurfaceType.MODAL:
                return this.openModal(viewWithIds, context, user, true);
        }
    }
    setViewError(errorInteraction, context, user) {
        const interactionContext = Object.assign(Object.assign({}, context), { type: uikit_1.UIKitInteractionType.ERRORS, appId: this.appId });
        return this.uiInteractionBridge.doNotifyUser(user, (0, UIKitInteractionPayloadFormatter_1.formatErrorInteraction)(errorInteraction, interactionContext), this.appId);
    }
    openContextualBar(view, context, user, isUpdate = false) {
        let type = uikit_1.UIKitInteractionType.CONTEXTUAL_BAR_OPEN;
        if (isUpdate) {
            type = uikit_1.UIKitInteractionType.CONTEXTUAL_BAR_UPDATE;
        }
        const interactionContext = Object.assign(Object.assign({}, context), { type, appId: this.appId });
        return this.uiInteractionBridge.doNotifyUser(user, (0, UIKitInteractionPayloadFormatter_1.formatContextualBarInteraction)(view, interactionContext), this.appId);
    }
    openModal(view, context, user, isUpdate = false) {
        let type = uikit_1.UIKitInteractionType.MODAL_OPEN;
        if (isUpdate) {
            type = uikit_1.UIKitInteractionType.MODAL_UPDATE;
        }
        const interactionContext = Object.assign(Object.assign({}, context), { type, appId: this.appId });
        return this.uiInteractionBridge.doNotifyUser(user, (0, UIKitInteractionPayloadFormatter_1.formatModalInteraction)(view, interactionContext), this.appId);
    }
}
exports.UIController = UIController;
//# sourceMappingURL=UIController.js.map