"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppInterface = void 0;
var AppInterface;
(function (AppInterface) {
    // Bot
    AppInterface["IPostMessageSentToBot"] = "IPostMessageSentToBot";
    // Messages
    AppInterface["IPreMessageSentPrevent"] = "IPreMessageSentPrevent";
    AppInterface["IPreMessageSentExtend"] = "IPreMessageSentExtend";
    AppInterface["IPreMessageSentModify"] = "IPreMessageSentModify";
    AppInterface["IPostMessageSent"] = "IPostMessageSent";
    AppInterface["IPostSystemMessageSent"] = "IPostSystemMessageSent";
    AppInterface["IPreMessageDeletePrevent"] = "IPreMessageDeletePrevent";
    AppInterface["IPostMessageDeleted"] = "IPostMessageDeleted";
    AppInterface["IPreMessageUpdatedPrevent"] = "IPreMessageUpdatedPrevent";
    AppInterface["IPreMessageUpdatedExtend"] = "IPreMessageUpdatedExtend";
    AppInterface["IPreMessageUpdatedModify"] = "IPreMessageUpdatedModify";
    AppInterface["IPostMessageUpdated"] = "IPostMessageUpdated";
    AppInterface["IPostMessageReacted"] = "IPostMessageReacted";
    AppInterface["IPostMessageFollowed"] = "IPostMessageFollowed";
    AppInterface["IPostMessagePinned"] = "IPostMessagePinned";
    AppInterface["IPostMessageStarred"] = "IPostMessageStarred";
    AppInterface["IPostMessageReported"] = "IPostMessageReported";
    // Rooms
    AppInterface["IPreRoomCreatePrevent"] = "IPreRoomCreatePrevent";
    AppInterface["IPreRoomCreateExtend"] = "IPreRoomCreateExtend";
    AppInterface["IPreRoomCreateModify"] = "IPreRoomCreateModify";
    AppInterface["IPostRoomCreate"] = "IPostRoomCreate";
    AppInterface["IPreRoomDeletePrevent"] = "IPreRoomDeletePrevent";
    AppInterface["IPostRoomDeleted"] = "IPostRoomDeleted";
    AppInterface["IPreRoomUserJoined"] = "IPreRoomUserJoined";
    AppInterface["IPostRoomUserJoined"] = "IPostRoomUserJoined";
    AppInterface["IPreRoomUserLeave"] = "IPreRoomUserLeave";
    AppInterface["IPostRoomUserLeave"] = "IPostRoomUserLeave";
    // External Components
    AppInterface["IPostExternalComponentOpened"] = "IPostExternalComponentOpened";
    AppInterface["IPostExternalComponentClosed"] = "IPostExternalComponentClosed";
    // Blocks
    AppInterface["IUIKitInteractionHandler"] = "IUIKitInteractionHandler";
    AppInterface["IUIKitLivechatInteractionHandler"] = "IUIKitLivechatInteractionHandler";
    // Livechat
    AppInterface["IPostLivechatRoomStarted"] = "IPostLivechatRoomStarted";
    AppInterface["IPostLivechatRoomClosed"] = "IPostLivechatRoomClosed";
    /**
     * @deprecated please use the AppMethod.EXECUTE_POST_LIVECHAT_ROOM_CLOSED method
     */
    AppInterface["ILivechatRoomClosedHandler"] = "ILivechatRoomClosedHandler";
    AppInterface["IPostLivechatAgentAssigned"] = "IPostLivechatAgentAssigned";
    AppInterface["IPostLivechatAgentUnassigned"] = "IPostLivechatAgentUnassigned";
    AppInterface["IPostLivechatRoomTransferred"] = "IPostLivechatRoomTransferred";
    AppInterface["IPostLivechatGuestSaved"] = "IPostLivechatGuestSaved";
    AppInterface["IPostLivechatRoomSaved"] = "IPostLivechatRoomSaved";
    // FileUpload
    AppInterface["IPreFileUpload"] = "IPreFileUpload";
    // Email
    AppInterface["IPreEmailSent"] = "IPreEmailSent";
    AppInterface["IPostUserCreated"] = "IPostUserCreated";
    AppInterface["IPostUserUpdated"] = "IPostUserUpdated";
    AppInterface["IPostUserDeleted"] = "IPostUserDeleted";
    AppInterface["IPostUserLoggedIn"] = "IPostUserLoggedIn";
    AppInterface["IPostUserLoggedOut"] = "IPostUserLoggedOut";
    AppInterface["IPostUserStatusChanged"] = "IPostUserStatusChanged";
})(AppInterface || (exports.AppInterface = AppInterface = {}));
//# sourceMappingURL=AppInterface.js.map