"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ModerationModify = void 0;
class ModerationModify {
    constructor(moderationBridge, appId) {
        this.moderationBridge = moderationBridge;
    }
    report(messageId, description, userId, appId) {
        return this.moderationBridge.doReport(messageId, description, userId, appId);
    }
    dismissReportsByMessageId(messageId, reason, action, appId) {
        return this.moderationBridge.doDismissReportsByMessageId(messageId, reason, action, appId);
    }
    dismissReportsByUserId(userId, reason, action, appId) {
        return this.moderationBridge.doDismissReportsByUserId(userId, reason, action, appId);
    }
}
exports.ModerationModify = ModerationModify;
//# sourceMappingURL=ModerationModify.js.map