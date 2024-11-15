import type { IPreEmailSentContext } from '../../definition/email';
import type { IExternalComponent } from '../../definition/externalComponent';
import type { ILivechatEventContext, ILivechatRoom, ILivechatTransferEventContext, IVisitor } from '../../definition/livechat';
import type { IMessage, IMessageDeleteContext, IMessageFollowContext, IMessagePinContext, IMessageReactionContext, IMessageReportContext, IMessageStarContext } from '../../definition/messages';
import { AppInterface } from '../../definition/metadata';
import type { IRoom, IRoomUserJoinedContext, IRoomUserLeaveContext } from '../../definition/rooms';
import type { IUIKitResponse, UIKitIncomingInteraction } from '../../definition/uikit';
import type { IUIKitLivechatIncomingInteraction } from '../../definition/uikit/livechat';
import type { IFileUploadContext } from '../../definition/uploads/IFileUploadContext';
import type { IUser, IUserContext, IUserStatusContext } from '../../definition/users';
import type { AppManager } from '../AppManager';
import type { ProxiedApp } from '../ProxiedApp';
interface IListenerExecutor {
    [AppInterface.IPreMessageSentPrevent]: {
        args: [IMessage];
        result: boolean;
    };
    [AppInterface.IPreMessageSentExtend]: {
        args: [IMessage];
        result: IMessage;
    };
    [AppInterface.IPreMessageSentModify]: {
        args: [IMessage];
        result: IMessage;
    };
    [AppInterface.IPostMessageSent]: {
        args: [IMessage];
        result: void;
    };
    [AppInterface.IPreMessageDeletePrevent]: {
        args: [IMessage];
        result: boolean;
    };
    [AppInterface.IPostMessageDeleted]: {
        args: [IMessageDeleteContext];
        result: void;
    };
    [AppInterface.IPreMessageUpdatedPrevent]: {
        args: [IMessage];
        result: unknown;
    };
    [AppInterface.IPreMessageUpdatedExtend]: {
        args: [IMessage];
        result: boolean;
    };
    [AppInterface.IPreMessageUpdatedModify]: {
        args: [IMessage];
        result: IMessage;
    };
    [AppInterface.IPostMessageUpdated]: {
        args: [IMessage];
        result: IMessage;
    };
    [AppInterface.IPostMessageReacted]: {
        args: [IMessageReactionContext];
        result: void;
    };
    [AppInterface.IPostMessageFollowed]: {
        args: [IMessageFollowContext];
        result: void;
    };
    [AppInterface.IPostMessagePinned]: {
        args: [IMessagePinContext];
        result: void;
    };
    [AppInterface.IPostMessageStarred]: {
        args: [IMessageStarContext];
        result: void;
    };
    [AppInterface.IPostMessageReported]: {
        args: [IMessageReportContext];
        result: void;
    };
    [AppInterface.IPreRoomCreatePrevent]: {
        args: [IRoom];
        result: boolean;
    };
    [AppInterface.IPreRoomCreateExtend]: {
        args: [IRoom];
        result: IRoom;
    };
    [AppInterface.IPreRoomCreateModify]: {
        args: [IRoom];
        result: IRoom;
    };
    [AppInterface.IPostRoomCreate]: {
        args: [IRoom];
        result: void;
    };
    [AppInterface.IPreRoomDeletePrevent]: {
        args: [IRoom];
        result: boolean;
    };
    [AppInterface.IPostRoomDeleted]: {
        args: [IRoom];
        result: void;
    };
    [AppInterface.IPreRoomUserJoined]: {
        args: [IRoomUserJoinedContext];
        result: void;
    };
    [AppInterface.IPostRoomUserJoined]: {
        args: [IRoomUserJoinedContext];
        result: void;
    };
    [AppInterface.IPreRoomUserLeave]: {
        args: [IRoomUserLeaveContext];
        result: void;
    };
    [AppInterface.IPostRoomUserLeave]: {
        args: [IRoomUserLeaveContext];
        result: void;
    };
    [AppInterface.IPostExternalComponentOpened]: {
        args: [IExternalComponent];
        result: void;
    };
    [AppInterface.IPostExternalComponentClosed]: {
        args: [IExternalComponent];
        result: void;
    };
    [AppInterface.IUIKitInteractionHandler]: {
        args: [UIKitIncomingInteraction];
        result: IUIKitResponse;
    };
    [AppInterface.IUIKitLivechatInteractionHandler]: {
        args: [IUIKitLivechatIncomingInteraction];
        result: IUIKitResponse;
    };
    [AppInterface.IPostLivechatRoomStarted]: {
        args: [ILivechatRoom];
        result: void;
    };
    /**
     * @deprecated please prefer the AppInterface.IPostLivechatRoomClosed event
     */
    [AppInterface.ILivechatRoomClosedHandler]: {
        args: [ILivechatRoom];
        result: void;
    };
    [AppInterface.IPostLivechatRoomClosed]: {
        args: [ILivechatRoom];
        result: void;
    };
    [AppInterface.IPostLivechatRoomSaved]: {
        args: [ILivechatRoom];
        result: void;
    };
    [AppInterface.IPostLivechatAgentAssigned]: {
        args: [ILivechatEventContext];
        result: void;
    };
    [AppInterface.IPostLivechatAgentUnassigned]: {
        args: [ILivechatEventContext];
        result: void;
    };
    [AppInterface.IPostLivechatRoomTransferred]: {
        args: [ILivechatTransferEventContext];
        result: void;
    };
    [AppInterface.IPostLivechatGuestSaved]: {
        args: [IVisitor];
        result: void;
    };
    [AppInterface.IPreFileUpload]: {
        args: [IFileUploadContext];
        result: void;
    };
    [AppInterface.IPreEmailSent]: {
        args: [IPreEmailSentContext];
        result: IUIKitResponse;
    };
    [AppInterface.IPostUserCreated]: {
        args: [IUserContext];
        result: void;
    };
    [AppInterface.IPostUserUpdated]: {
        args: [IUserContext];
        result: void;
    };
    [AppInterface.IPostUserDeleted]: {
        args: [IUserContext];
        result: void;
    };
    [AppInterface.IPostUserLoggedIn]: {
        args: [IUser];
        result: void;
    };
    [AppInterface.IPostUserLoggedOut]: {
        args: [IUser];
        result: void;
    };
    [AppInterface.IPostUserStatusChanged]: {
        args: [IUserStatusContext];
        result: void;
    };
}
export declare class AppListenerManager {
    private readonly manager;
    private am;
    private listeners;
    private defaultHandlers;
    /**
     * Locked events are those who are listed in an app's
     * "essentials" list but the app is disabled.
     *
     * They will throw a EssentialAppDisabledException upon call
     */
    private lockedEvents;
    constructor(manager: AppManager);
    registerListeners(app: ProxiedApp): void;
    unregisterListeners(app: ProxiedApp): void;
    releaseEssentialEvents(app: ProxiedApp): void;
    lockEssentialEvents(app: ProxiedApp): void;
    getListeners(int: AppInterface): Array<ProxiedApp>;
    isEventBlocked(event: AppInterface): boolean;
    executeListener<I extends keyof IListenerExecutor>(int: I, data: IListenerExecutor[I]['args'][0]): Promise<IListenerExecutor[I]['result']>;
    private executePreMessageSentPrevent;
    private executePreMessageSentExtend;
    private executePreMessageSentModify;
    private executePostMessageSent;
    private executePreMessageDeletePrevent;
    private executePostMessageDelete;
    private executePreMessageUpdatedPrevent;
    private executePreMessageUpdatedExtend;
    private executePreMessageUpdatedModify;
    private executePostMessageUpdated;
    private executePreRoomCreatePrevent;
    private executePreRoomCreateExtend;
    private executePreRoomCreateModify;
    private executePostRoomCreate;
    private executePreRoomDeletePrevent;
    private executePostRoomDeleted;
    private executePreRoomUserJoined;
    private executePostRoomUserJoined;
    private executePreRoomUserLeave;
    private executePostRoomUserLeave;
    private executePostExternalComponentOpened;
    private executePostExternalComponentClosed;
    private executeUIKitInteraction;
    private executeUIKitLivechatInteraction;
    private executePostLivechatRoomStarted;
    private executeLivechatRoomClosedHandler;
    private executePostLivechatRoomClosed;
    private executePostLivechatAgentAssigned;
    private executePostLivechatAgentUnassigned;
    private executePostLivechatRoomTransferred;
    private executePostLivechatGuestSaved;
    private executePostLivechatRoomSaved;
    private executePreFileUpload;
    private executePreEmailSent;
    private executePostMessageReacted;
    private executePostMessageFollowed;
    private executePostMessagePinned;
    private executePostMessageStarred;
    private executePostMessageReported;
    private executePostUserCreated;
    private executePostUserUpdated;
    private executePostUserDeleted;
    private executePostUserLoggedIn;
    private executePostUserLoggedOut;
    private executePostUserStatusChanged;
}
export {};
