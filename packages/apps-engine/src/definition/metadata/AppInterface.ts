export enum AppInterface {
    // Bot
    IPostMessageSentToBot = 'IPostMessageSentToBot',

    // Messages
    IPreMessageSentPrevent = 'IPreMessageSentPrevent',
    IPreMessageSentExtend = 'IPreMessageSentExtend',
    IPreMessageSentModify = 'IPreMessageSentModify',
    IPostMessageSent = 'IPostMessageSent',
    IPostSystemMessageSent = 'IPostSystemMessageSent',
    IPreMessageDeletePrevent = 'IPreMessageDeletePrevent',
    IPostMessageDeleted = 'IPostMessageDeleted',
    IPreMessageUpdatedPrevent = 'IPreMessageUpdatedPrevent',
    IPreMessageUpdatedExtend = 'IPreMessageUpdatedExtend',
    IPreMessageUpdatedModify = 'IPreMessageUpdatedModify',
    IPostMessageUpdated = 'IPostMessageUpdated',
    IPostMessageReacted = 'IPostMessageReacted',
    IPostMessageFollowed = 'IPostMessageFollowed',
    IPostMessagePinned = 'IPostMessagePinned',
    IPostMessageStarred = 'IPostMessageStarred',
    IPostMessageReported = 'IPostMessageReported',
    // Rooms
    IPreRoomCreatePrevent = 'IPreRoomCreatePrevent',
    IPreRoomCreateExtend = 'IPreRoomCreateExtend',
    IPreRoomCreateModify = 'IPreRoomCreateModify',
    IPostRoomCreate = 'IPostRoomCreate',
    IPreRoomDeletePrevent = 'IPreRoomDeletePrevent',
    IPostRoomDeleted = 'IPostRoomDeleted',
    IPreRoomUserJoined = 'IPreRoomUserJoined',
    IPostRoomUserJoined = 'IPostRoomUserJoined',
    IPreRoomUserLeave = 'IPreRoomUserLeave',
    IPostRoomUserLeave = 'IPostRoomUserLeave',
    // External Components
    IPostExternalComponentOpened = 'IPostExternalComponentOpened',
    IPostExternalComponentClosed = 'IPostExternalComponentClosed',
    // Blocks
    IUIKitInteractionHandler = 'IUIKitInteractionHandler',
    IUIKitLivechatInteractionHandler = 'IUIKitLivechatInteractionHandler',
    // Livechat
    IPostLivechatRoomStarted = 'IPostLivechatRoomStarted',
    IPostLivechatRoomClosed = 'IPostLivechatRoomClosed',
    /**
     * @deprecated please use the AppMethod.EXECUTE_POST_LIVECHAT_ROOM_CLOSED method
     */
    ILivechatRoomClosedHandler = 'ILivechatRoomClosedHandler',
    IPreLivechatRoomCreatePrevent = "IPreLivechatRoomCreatePrevent",
    IPostLivechatAgentAssigned = 'IPostLivechatAgentAssigned',
    IPostLivechatAgentUnassigned = 'IPostLivechatAgentUnassigned',
    IPostLivechatRoomTransferred = 'IPostLivechatRoomTransferred',
    IPostLivechatGuestSaved = 'IPostLivechatGuestSaved',
    IPostLivechatRoomSaved = 'IPostLivechatRoomSaved',
    IPostLivechatDepartmentRemoved = 'IPostLivechatDepartmentRemoved',
    IPostLivechatDepartmentDisabled = 'IPostLivechatDepartmentDisabled',
    // FileUpload
    IPreFileUpload = 'IPreFileUpload',
    // Email
    IPreEmailSent = 'IPreEmailSent',
    IPostUserCreated = 'IPostUserCreated',
    IPostUserUpdated = 'IPostUserUpdated',
    IPostUserDeleted = 'IPostUserDeleted',
    IPostUserLoggedIn = 'IPostUserLoggedIn',
    IPostUserLoggedOut = 'IPostUserLoggedOut',
    IPostUserStatusChanged = 'IPostUserStatusChanged',
}
