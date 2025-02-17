"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.formatModalInteraction = formatModalInteraction;
exports.formatContextualBarInteraction = formatContextualBarInteraction;
exports.formatErrorInteraction = formatErrorInteraction;
const uuid_1 = require("uuid");
const IUIKitInteractionType_1 = require("./IUIKitInteractionType");
const IUIKitSurface_1 = require("./IUIKitSurface");
function isModalInteraction(type) {
    return [IUIKitInteractionType_1.UIKitInteractionType.MODAL_OPEN, IUIKitInteractionType_1.UIKitInteractionType.MODAL_UPDATE, IUIKitInteractionType_1.UIKitInteractionType.MODAL_CLOSE].includes(type);
}
function formatModalInteraction(view, context) {
    if (!isModalInteraction(context.type)) {
        throw new Error(`Invalid type "${context.type}" for modal interaction`);
    }
    return {
        type: context.type,
        triggerId: context.triggerId,
        appId: context.appId,
        view: Object.assign(Object.assign({ appId: context.appId, type: IUIKitSurface_1.UIKitSurfaceType.MODAL, id: view.id ? view.id : (0, uuid_1.v1)() }, view), { showIcon: true }),
    };
}
function isContextualBarInteraction(type) {
    return [IUIKitInteractionType_1.UIKitInteractionType.CONTEXTUAL_BAR_OPEN, IUIKitInteractionType_1.UIKitInteractionType.CONTEXTUAL_BAR_UPDATE, IUIKitInteractionType_1.UIKitInteractionType.CONTEXTUAL_BAR_CLOSE].includes(type);
}
function formatContextualBarInteraction(view, context) {
    if (!isContextualBarInteraction(context.type)) {
        throw new Error(`Invalid type "${context.type}" for contextual bar interaction`);
    }
    return {
        type: context.type,
        triggerId: context.triggerId,
        appId: context.appId,
        view: Object.assign(Object.assign({ appId: context.appId, type: IUIKitSurface_1.UIKitSurfaceType.CONTEXTUAL_BAR, id: view.id ? view.id : (0, uuid_1.v1)() }, view), { showIcon: true }),
    };
}
function formatErrorInteraction(errorInteraction, context) {
    if (IUIKitInteractionType_1.UIKitInteractionType.ERRORS !== context.type) {
        throw new Error(`Invalid type "${context.type}" for error interaction`);
    }
    return {
        appId: context.appId,
        type: IUIKitInteractionType_1.UIKitInteractionType.ERRORS,
        errors: errorInteraction.errors,
        viewId: errorInteraction.viewId,
        triggerId: context.triggerId,
    };
}
//# sourceMappingURL=UIKitInteractionPayloadFormatter.js.map