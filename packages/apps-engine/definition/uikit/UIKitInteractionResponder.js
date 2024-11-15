"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UIKitInteractionResponder = void 0;
const IUIKitInteractionType_1 = require("./IUIKitInteractionType");
const UIKitInteractionPayloadFormatter_1 = require("./UIKitInteractionPayloadFormatter");
class UIKitInteractionResponder {
    constructor(baseContext) {
        this.baseContext = baseContext;
    }
    successResponse() {
        return {
            success: true,
        };
    }
    errorResponse() {
        return {
            success: false,
        };
    }
    openModalViewResponse(viewData) {
        const { appId, triggerId } = this.baseContext;
        return Object.assign({ success: true }, (0, UIKitInteractionPayloadFormatter_1.formatModalInteraction)(viewData, { appId, triggerId, type: IUIKitInteractionType_1.UIKitInteractionType.MODAL_OPEN }));
    }
    updateModalViewResponse(viewData) {
        const { appId, triggerId } = this.baseContext;
        return Object.assign({ success: true }, (0, UIKitInteractionPayloadFormatter_1.formatModalInteraction)(viewData, { appId, triggerId, type: IUIKitInteractionType_1.UIKitInteractionType.MODAL_UPDATE }));
    }
    openContextualBarViewResponse(viewData) {
        const { appId, triggerId } = this.baseContext;
        return Object.assign({ success: true }, (0, UIKitInteractionPayloadFormatter_1.formatContextualBarInteraction)(viewData, { appId, triggerId, type: IUIKitInteractionType_1.UIKitInteractionType.CONTEXTUAL_BAR_OPEN }));
    }
    updateContextualBarViewResponse(viewData) {
        const { appId, triggerId } = this.baseContext;
        return Object.assign({ success: true }, (0, UIKitInteractionPayloadFormatter_1.formatContextualBarInteraction)(viewData, { appId, triggerId, type: IUIKitInteractionType_1.UIKitInteractionType.CONTEXTUAL_BAR_UPDATE }));
    }
    viewErrorResponse(errorInteraction) {
        const { appId, triggerId } = this.baseContext;
        return {
            appId,
            triggerId,
            success: false,
            type: IUIKitInteractionType_1.UIKitInteractionType.ERRORS,
            viewId: errorInteraction.viewId,
            errors: errorInteraction.errors,
        };
    }
}
exports.UIKitInteractionResponder = UIKitInteractionResponder;
//# sourceMappingURL=UIKitInteractionResponder.js.map