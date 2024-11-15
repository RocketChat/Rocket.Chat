"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppMethod = void 0;
var AppMethod;
(function (AppMethod) {
    AppMethod["_API_EXECUTOR"] = "apiExecutor";
    AppMethod["_CONSTRUCTOR"] = "constructor";
    AppMethod["_COMMAND_EXECUTOR"] = "executor";
    AppMethod["_COMMAND_PREVIEWER"] = "previewer";
    AppMethod["_COMMAND_PREVIEW_EXECUTOR"] = "executePreviewItem";
    AppMethod["_JOB_PROCESSOR"] = "jobProcessor";
    AppMethod["_VIDEOCONF_GENERATE_URL"] = "generateUrl";
    AppMethod["_VIDEOCONF_CUSTOMIZE_URL"] = "customizeUrl";
    AppMethod["_VIDEOCONF_IS_CONFIGURED"] = "isFullyConfigured";
    AppMethod["_VIDEOCONF_NEW"] = "onNewVideoConference";
    AppMethod["_VIDEOCONF_CHANGED"] = "onVideoConferenceChanged";
    AppMethod["_VIDEOCONF_USER_JOINED"] = "onUserJoin";
    AppMethod["_VIDEOCONF_GET_INFO"] = "getVideoConferenceInfo";
    AppMethod["INITIALIZE"] = "initialize";
    AppMethod["ONENABLE"] = "onEnable";
    AppMethod["ONDISABLE"] = "onDisable";
    AppMethod["ONINSTALL"] = "onInstall";
    AppMethod["ONUNINSTALL"] = "onUninstall";
    AppMethod["ONUPDATE"] = "onUpdate";
    AppMethod["ON_PRE_SETTING_UPDATE"] = "onPreSettingUpdate";
    AppMethod["ONSETTINGUPDATED"] = "onSettingUpdated";
    AppMethod["SETSTATUS"] = "setStatus";
    // Message handlers
    AppMethod["CHECKPREMESSAGESENTPREVENT"] = "checkPreMessageSentPrevent";
    AppMethod["EXECUTEPREMESSAGESENTPREVENT"] = "executePreMessageSentPrevent";
    AppMethod["CHECKPREMESSAGESENTEXTEND"] = "checkPreMessageSentExtend";
    AppMethod["EXECUTEPREMESSAGESENTEXTEND"] = "executePreMessageSentExtend";
    AppMethod["CHECKPREMESSAGESENTMODIFY"] = "checkPreMessageSentModify";
    AppMethod["EXECUTEPREMESSAGESENTMODIFY"] = "executePreMessageSentModify";
    AppMethod["CHECKPOSTMESSAGESENT"] = "checkPostMessageSent";
    AppMethod["EXECUTEPOSTMESSAGESENT"] = "executePostMessageSent";
    AppMethod["EXECUTEPOSTMESSAGESENTTOBOT"] = "executePostMessageSentToBot";
    AppMethod["CHECKPREMESSAGEDELETEPREVENT"] = "checkPreMessageDeletePrevent";
    AppMethod["EXECUTEPREMESSAGEDELETEPREVENT"] = "executePreMessageDeletePrevent";
    AppMethod["CHECKPOSTMESSAGEDELETED"] = "checkPostMessageDeleted";
    AppMethod["EXECUTEPOSTMESSAGEDELETED"] = "executePostMessageDeleted";
    AppMethod["CHECKPREMESSAGEUPDATEDPREVENT"] = "checkPreMessageUpdatedPrevent";
    AppMethod["EXECUTEPREMESSAGEUPDATEDPREVENT"] = "executePreMessageUpdatedPrevent";
    AppMethod["CHECKPREMESSAGEUPDATEDEXTEND"] = "checkPreMessageUpdatedExtend";
    AppMethod["EXECUTEPREMESSAGEUPDATEDEXTEND"] = "executePreMessageUpdatedExtend";
    AppMethod["CHECKPREMESSAGEUPDATEDMODIFY"] = "checkPreMessageUpdatedModify";
    AppMethod["EXECUTEPREMESSAGEUPDATEDMODIFY"] = "executePreMessageUpdatedModify";
    AppMethod["CHECKPOSTMESSAGEUPDATED"] = "checkPostMessageUpdated";
    AppMethod["EXECUTEPOSTMESSAGEUPDATED"] = "executePostMessageUpdated";
    AppMethod["EXECUTE_POST_MESSAGE_REACTED"] = "executePostMessageReacted";
    AppMethod["EXECUTE_POST_MESSAGE_FOLLOWED"] = "executePostMessageFollowed";
    AppMethod["EXECUTE_POST_MESSAGE_PINNED"] = "executePostMessagePinned";
    AppMethod["EXECUTE_POST_MESSAGE_STARRED"] = "executePostMessageStarred";
    AppMethod["EXECUTE_POST_MESSAGE_REPORTED"] = "executePostMessageReported";
    // Room handlers
    AppMethod["CHECKPREROOMCREATEPREVENT"] = "checkPreRoomCreatePrevent";
    AppMethod["EXECUTEPREROOMCREATEPREVENT"] = "executePreRoomCreatePrevent";
    AppMethod["CHECKPREROOMCREATEEXTEND"] = "checkPreRoomCreateExtend";
    AppMethod["EXECUTEPREROOMCREATEEXTEND"] = "executePreRoomCreateExtend";
    AppMethod["CHECKPREROOMCREATEMODIFY"] = "checkPreRoomCreateModify";
    AppMethod["EXECUTEPREROOMCREATEMODIFY"] = "executePreRoomCreateModify";
    AppMethod["CHECKPOSTROOMCREATE"] = "checkPostRoomCreate";
    AppMethod["EXECUTEPOSTROOMCREATE"] = "executePostRoomCreate";
    AppMethod["CHECKPREROOMDELETEPREVENT"] = "checkPreRoomDeletePrevent";
    AppMethod["EXECUTEPREROOMDELETEPREVENT"] = "executePreRoomDeletePrevent";
    AppMethod["CHECKPOSTROOMDELETED"] = "checkPostRoomDeleted";
    AppMethod["EXECUTEPOSTROOMDELETED"] = "executePostRoomDeleted";
    AppMethod["EXECUTE_PRE_ROOM_USER_JOINED"] = "executePreRoomUserJoined";
    AppMethod["EXECUTE_POST_ROOM_USER_JOINED"] = "executePostRoomUserJoined";
    AppMethod["EXECUTE_PRE_ROOM_USER_LEAVE"] = "executePreRoomUserLeave";
    AppMethod["EXECUTE_POST_ROOM_USER_LEAVE"] = "executePostRoomUserLeave";
    // External Component handlers
    AppMethod["EXECUTEPOSTEXTERNALCOMPONENTOPENED"] = "executePostExternalComponentOpened";
    AppMethod["EXECUTEPOSTEXTERNALCOMPONENTCLOSED"] = "executePostExternalComponentClosed";
    // Blockit handlers
    AppMethod["UIKIT_BLOCK_ACTION"] = "executeBlockActionHandler";
    AppMethod["UIKIT_VIEW_SUBMIT"] = "executeViewSubmitHandler";
    AppMethod["UIKIT_VIEW_CLOSE"] = "executeViewClosedHandler";
    AppMethod["UIKIT_ACTION_BUTTON"] = "executeActionButtonHandler";
    AppMethod["UIKIT_LIVECHAT_BLOCK_ACTION"] = "executeLivechatBlockActionHandler";
    // Livechat
    AppMethod["EXECUTE_POST_LIVECHAT_ROOM_STARTED"] = "executePostLivechatRoomStarted";
    /**
     * @deprecated please use the AppMethod.EXECUTE_POST_LIVECHAT_ROOM_CLOSED method
     */
    AppMethod["EXECUTE_LIVECHAT_ROOM_CLOSED_HANDLER"] = "executeLivechatRoomClosedHandler";
    AppMethod["EXECUTE_POST_LIVECHAT_ROOM_CLOSED"] = "executePostLivechatRoomClosed";
    AppMethod["EXECUTE_POST_LIVECHAT_AGENT_ASSIGNED"] = "executePostLivechatAgentAssigned";
    AppMethod["EXECUTE_POST_LIVECHAT_AGENT_UNASSIGNED"] = "executePostLivechatAgentUnassigned";
    AppMethod["EXECUTE_POST_LIVECHAT_ROOM_TRANSFERRED"] = "executePostLivechatRoomTransferred";
    AppMethod["EXECUTE_POST_LIVECHAT_GUEST_SAVED"] = "executePostLivechatGuestSaved";
    AppMethod["EXECUTE_POST_LIVECHAT_ROOM_SAVED"] = "executePostLivechatRoomSaved";
    // FileUpload
    AppMethod["EXECUTE_PRE_FILE_UPLOAD"] = "executePreFileUpload";
    // Email
    AppMethod["EXECUTE_PRE_EMAIL_SENT"] = "executePreEmailSent";
    // User
    AppMethod["EXECUTE_POST_USER_CREATED"] = "executePostUserCreated";
    AppMethod["EXECUTE_POST_USER_UPDATED"] = "executePostUserUpdated";
    AppMethod["EXECUTE_POST_USER_DELETED"] = "executePostUserDeleted";
    AppMethod["EXECUTE_POST_USER_LOGGED_IN"] = "executePostUserLoggedIn";
    AppMethod["EXECUTE_POST_USER_LOGGED_OUT"] = "executePostUserLoggedOut";
    AppMethod["EXECUTE_POST_USER_STATUS_CHANGED"] = "executePostUserStatusChanged";
    // Runtime specific methods
    AppMethod["RUNTIME_RESTART"] = "runtime:restart";
})(AppMethod || (exports.AppMethod = AppMethod = {}));
//# sourceMappingURL=AppMethod.js.map