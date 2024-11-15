"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isSendMessageTrigger = exports.isExternalServiceTrigger = void 0;
const isExternalServiceTrigger = (trigger) => {
    return trigger.actions.every((action) => action.name === 'use-external-service');
};
exports.isExternalServiceTrigger = isExternalServiceTrigger;
const isSendMessageTrigger = (trigger) => {
    return trigger.actions.every((action) => action.name === 'send-message');
};
exports.isSendMessageTrigger = isSendMessageTrigger;
//# sourceMappingURL=ILivechatTrigger.js.map