import type { AppAccessorManager } from './AppAccessorManager';
import type { IEmailDescriptor, IPreEmailSentContext } from '../../definition/email';
import { EssentialAppDisabledException } from '../../definition/exceptions';
import type { IExternalComponent } from '../../definition/externalComponent';
import type { ILivechatEventContext, ILivechatRoom, ILivechatTransferEventContext, IVisitor } from '../../definition/livechat';
import type { ILivechatDepartmentEventContext } from '../../definition/livechat/ILivechatEventContext';
import type {
    IMessage,
    IMessageDeleteContext,
    IMessageFollowContext,
    IMessagePinContext,
    IMessageReactionContext,
    IMessageReportContext,
    IMessageStarContext,
} from '../../definition/messages';
import { AppInterface, AppMethod } from '../../definition/metadata';
import type { IRoom, IRoomUserJoinedContext, IRoomUserLeaveContext } from '../../definition/rooms';
import { RoomType } from '../../definition/rooms';
import { UIActionButtonContext } from '../../definition/ui';
import type { IUIKitResponse, IUIKitSurface, UIKitIncomingInteraction } from '../../definition/uikit';
import { UIKitIncomingInteractionType } from '../../definition/uikit';
import { isUIKitIncomingInteractionActionButtonMessageBox } from '../../definition/uikit/IUIKitIncomingInteractionActionButton';
import type {
    IUIKitIncomingInteractionMessageContainer,
    IUIKitIncomingInteractionModalContainer,
} from '../../definition/uikit/UIKitIncomingInteractionContainer';
import type { IUIKitLivechatBlockIncomingInteraction, IUIKitLivechatIncomingInteraction } from '../../definition/uikit/livechat';
import type { IFileUploadContext } from '../../definition/uploads/IFileUploadContext';
import type { IUser, IUserContext, IUserStatusContext, IUserUpdateContext } from '../../definition/users';
import type { AppManager } from '../AppManager';
import type { ProxiedApp } from '../ProxiedApp';
import { Utilities } from '../misc/Utilities';
import { JSONRPC_METHOD_NOT_FOUND } from '../runtime/deno/AppsEngineDenoRuntime';

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
    [AppInterface.IPostSystemMessageSent]: {
        args: [IMessage];
        result: void;
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
    // Rooms
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
    // External Components
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
    // Livechat
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
    [AppInterface.IPreLivechatRoomCreatePrevent]: {
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
    [AppInterface.IPostLivechatDepartmentRemoved]: {
        args: [ILivechatDepartmentEventContext];
        result: void;
    };
    [AppInterface.IPostLivechatDepartmentDisabled]: {
        args: [ILivechatDepartmentEventContext];
        result: void;
    };
    // FileUpload
    [AppInterface.IPreFileUpload]: {
        args: [IFileUploadContext];
        result: void;
    };
    // Email
    [AppInterface.IPreEmailSent]: {
        args: [IPreEmailSentContext];
        result: IUIKitResponse;
    };
    // User
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

// type EventReturn = void | boolean | IMessage | IRoom | IUser | IUIKitResponse | ILivechatRoom | IEmailDescriptor;

export class AppListenerManager {
    private am: AppAccessorManager;

    private listeners: Map<string, Array<string>>;

    private defaultHandlers = new Map<string, any>();

    /**
     * Locked events are those who are listed in an app's
     * "essentials" list but the app is disabled.
     *
     * They will throw a EssentialAppDisabledException upon call
     */
    private lockedEvents: Map<string, Set<string>>;

    constructor(private readonly manager: AppManager) {
        this.am = manager.getAccessorManager();
        this.listeners = new Map<string, Array<string>>();
        this.lockedEvents = new Map<string, Set<string>>();

        Object.keys(AppInterface).forEach((intt) => {
            this.listeners.set(intt, []);
            this.lockedEvents.set(intt, new Set<string>());
        });

        this.defaultHandlers.set('executeViewClosedHandler', { success: true });
    }

    public registerListeners(app: ProxiedApp): void {
        this.unregisterListeners(app);

        Object.entries(app.getImplementationList()).forEach(([event, isImplemented]) => {
            if (!isImplemented) {
                return;
            }

            this.listeners.get(event).push(app.getID());
        });
    }

    public unregisterListeners(app: ProxiedApp): void {
        this.listeners.forEach((apps, int) => {
            if (apps.includes(app.getID())) {
                const where = apps.indexOf(app.getID());
                this.listeners.get(int).splice(where, 1);
            }
        });
    }

    public releaseEssentialEvents(app: ProxiedApp): void {
        if (!app.getEssentials()) {
            return;
        }

        app.getEssentials().forEach((event) => {
            const lockedEvent = this.lockedEvents.get(event);

            if (!lockedEvent) {
                return;
            }

            lockedEvent.delete(app.getID());
        });
    }

    public lockEssentialEvents(app: ProxiedApp): void {
        if (!app.getEssentials()) {
            return;
        }

        app.getEssentials().forEach((event) => {
            const lockedEvent = this.lockedEvents.get(event);

            if (!lockedEvent) {
                return;
            }

            lockedEvent.add(app.getID());
        });
    }

    public getListeners(int: AppInterface): Array<ProxiedApp> {
        const results: Array<ProxiedApp> = [];

        for (const appId of this.listeners.get(int)) {
            results.push(this.manager.getOneById(appId));
        }

        return results;
    }

    public isEventBlocked(event: AppInterface): boolean {
        const lockedEventList = this.lockedEvents.get(event);

        return !!(lockedEventList && lockedEventList.size);
    }

    /* eslint-disable-next-line complexity */
    public async executeListener<I extends keyof IListenerExecutor>(int: I, data: IListenerExecutor[I]['args'][0]): Promise<IListenerExecutor[I]['result']> {
        if (this.isEventBlocked(int)) {
            throw new EssentialAppDisabledException('There is one or more apps that are essential to this event but are disabled');
        }

        switch (int) {
            // Messages
            case AppInterface.IPreMessageSentPrevent:
                return this.executePreMessageSentPrevent(data as IMessage);
            case AppInterface.IPreMessageSentExtend:
                return this.executePreMessageSentExtend(data as IMessage);
            case AppInterface.IPreMessageSentModify:
                return this.executePreMessageSentModify(data as IMessage);
            case AppInterface.IPostMessageSent:
                this.executePostMessageSent(data as IMessage);
                return;
            case AppInterface.IPostSystemMessageSent:
                this.executePostSystemMessageSent(data as IMessage);
                return;
            case AppInterface.IPreMessageDeletePrevent:
                return this.executePreMessageDeletePrevent(data as IMessage);
            case AppInterface.IPostMessageDeleted:
                this.executePostMessageDelete(data as IMessageDeleteContext);
                return;
            case AppInterface.IPreMessageUpdatedPrevent:
                return this.executePreMessageUpdatedPrevent(data as IMessage);
            case AppInterface.IPreMessageUpdatedExtend:
                return this.executePreMessageUpdatedExtend(data as IMessage);
            case AppInterface.IPreMessageUpdatedModify:
                return this.executePreMessageUpdatedModify(data as IMessage);
            case AppInterface.IPostMessageUpdated:
                this.executePostMessageUpdated(data as IMessage);
                return;
            case AppInterface.IPostMessageReacted:
                return this.executePostMessageReacted(data as IMessageReactionContext);
            case AppInterface.IPostMessageFollowed:
                return this.executePostMessageFollowed(data as IMessageFollowContext);
            case AppInterface.IPostMessagePinned:
                return this.executePostMessagePinned(data as IMessagePinContext);
            case AppInterface.IPostMessageStarred:
                return this.executePostMessageStarred(data as IMessageStarContext);
            case AppInterface.IPostMessageReported:
                return this.executePostMessageReported(data as IMessageReportContext);
            // Rooms
            case AppInterface.IPreRoomCreatePrevent:
                return this.executePreRoomCreatePrevent(data as IRoom);
            case AppInterface.IPreRoomCreateExtend:
                return this.executePreRoomCreateExtend(data as IRoom);
            case AppInterface.IPreRoomCreateModify:
                return this.executePreRoomCreateModify(data as IRoom);
            case AppInterface.IPostRoomCreate:
                this.executePostRoomCreate(data as IRoom);
                return;
            case AppInterface.IPreRoomDeletePrevent:
                return this.executePreRoomDeletePrevent(data as IRoom);
            case AppInterface.IPostRoomDeleted:
                this.executePostRoomDeleted(data as IRoom);
                return;
            case AppInterface.IPreRoomUserJoined:
                return this.executePreRoomUserJoined(data as IRoomUserJoinedContext);
            case AppInterface.IPostRoomUserJoined:
                return this.executePostRoomUserJoined(data as IRoomUserJoinedContext);
            case AppInterface.IPreRoomUserLeave:
                return this.executePreRoomUserLeave(data as IRoomUserLeaveContext);
            case AppInterface.IPostRoomUserLeave:
                return this.executePostRoomUserLeave(data as IRoomUserLeaveContext);
            // External Components
            case AppInterface.IPostExternalComponentOpened:
                this.executePostExternalComponentOpened(data as IExternalComponent);
                return;
            case AppInterface.IPostExternalComponentClosed:
                this.executePostExternalComponentClosed(data as IExternalComponent);
                return;
            case AppInterface.IUIKitInteractionHandler:
                return this.executeUIKitInteraction(data as UIKitIncomingInteraction);
            case AppInterface.IUIKitLivechatInteractionHandler:
                return this.executeUIKitLivechatInteraction(data as IUIKitLivechatIncomingInteraction);
            // Livechat
            case AppInterface.IPostLivechatRoomStarted:
                return this.executePostLivechatRoomStarted(data as ILivechatRoom);
            /**
             * @deprecated please prefer the AppInterface.IPostLivechatRoomClosed event
             */
            case AppInterface.ILivechatRoomClosedHandler:
                return this.executeLivechatRoomClosedHandler(data as ILivechatRoom);
            case AppInterface.IPreLivechatRoomCreatePrevent:
                return this.executePreLivechatRoomCreatePrevent(data as ILivechatRoom);
            case AppInterface.IPostLivechatRoomClosed:
                return this.executePostLivechatRoomClosed(data as ILivechatRoom);
            case AppInterface.IPostLivechatRoomSaved:
                return this.executePostLivechatRoomSaved(data as ILivechatRoom);
            case AppInterface.IPostLivechatAgentAssigned:
                return this.executePostLivechatAgentAssigned(data as ILivechatEventContext);
            case AppInterface.IPostLivechatAgentUnassigned:
                return this.executePostLivechatAgentUnassigned(data as ILivechatEventContext);
            case AppInterface.IPostLivechatRoomTransferred:
                return this.executePostLivechatRoomTransferred(data as ILivechatTransferEventContext);
            case AppInterface.IPostLivechatDepartmentRemoved:
                return this.executePostLivechatDepartmentRemoved(data as ILivechatDepartmentEventContext);
            case AppInterface.IPostLivechatDepartmentDisabled:
                return this.executePostLivechatDepartmentDisabled(data as ILivechatDepartmentEventContext);
            case AppInterface.IPostLivechatGuestSaved:
                return this.executePostLivechatGuestSaved(data as IVisitor);
            // FileUpload
            case AppInterface.IPreFileUpload:
                return this.executePreFileUpload(data as IFileUploadContext);
            // Email
            case AppInterface.IPreEmailSent:
                return this.executePreEmailSent(data as IPreEmailSentContext);
            // User
            case AppInterface.IPostUserCreated:
                return this.executePostUserCreated(data as IUserContext);
            case AppInterface.IPostUserUpdated:
                return this.executePostUserUpdated(data as IUserContext);
            case AppInterface.IPostUserDeleted:
                return this.executePostUserDeleted(data as IUserContext);
            case AppInterface.IPostUserLoggedIn:
                return this.executePostUserLoggedIn(data as IUser);
            case AppInterface.IPostUserLoggedOut:
                return this.executePostUserLoggedOut(data as IUser);
            case AppInterface.IPostUserStatusChanged:
                return this.executePostUserStatusChanged(data as IUserStatusContext);
            default:
                console.warn('An invalid listener was called');
        }
    }

    // Messages
    private async executePreMessageSentPrevent(data: IMessage): Promise<boolean> {
        let prevented = false;

        for (const appId of this.listeners.get(AppInterface.IPreMessageSentPrevent)) {
            const app = this.manager.getOneById(appId);

            const continueOn = (await app.call(AppMethod.CHECKPREMESSAGESENTPREVENT, data).catch((error) => {
                // This method is optional, so if it doesn't exist, we should continue
                if (error?.code === JSONRPC_METHOD_NOT_FOUND) {
                    return true;
                }

                throw error;
            })) as boolean;

            if (!continueOn) {
                continue;
            }

            prevented = (await app.call(AppMethod.EXECUTEPREMESSAGESENTPREVENT, data)) as boolean;

            if (prevented) {
                return prevented;
            }
        }

        return prevented;
    }

    private async executePreMessageSentExtend(data: IMessage): Promise<IMessage> {
        let msg = data;

        for (const appId of this.listeners.get(AppInterface.IPreMessageSentExtend)) {
            const app = this.manager.getOneById(appId);

            const continueOn = (await app.call(AppMethod.CHECKPREMESSAGESENTEXTEND, data).catch((error) => {
                // This method is optional, so if it doesn't exist, we should continue
                if (error?.code === JSONRPC_METHOD_NOT_FOUND) {
                    return true;
                }

                throw error;
            })) as boolean;

            if (continueOn) {
                msg = await app.call(AppMethod.EXECUTEPREMESSAGESENTEXTEND, msg);
            }
        }

        return msg;
    }

    private async executePreMessageSentModify(data: IMessage): Promise<IMessage> {
        let msg = data;

        for (const appId of this.listeners.get(AppInterface.IPreMessageSentModify)) {
            const app = this.manager.getOneById(appId);

            const continueOn = (await app.call(AppMethod.CHECKPREMESSAGESENTMODIFY, msg).catch((error) => {
                // This method is optional, so if it doesn't exist, we should continue
                if (error?.code === JSONRPC_METHOD_NOT_FOUND) {
                    return true;
                }

                throw error;
            })) as boolean;

            if (continueOn) {
                msg = (await app.call(AppMethod.EXECUTEPREMESSAGESENTMODIFY, msg)) as IMessage;
            }
        }

        return msg;
    }

    private async executePostMessageSent(data: IMessage): Promise<void> {
        // First check if the app implements Bot DM handlers and check if the dm contains more than one user
        if (data.room.type === RoomType.DIRECT_MESSAGE && data.room.userIds.length > 1) {
            for (const appId of this.listeners.get(AppInterface.IPostMessageSentToBot)) {
                const app = this.manager.getOneById(appId);

                const reader = this.am.getReader(appId);
                const bot = await reader.getUserReader().getAppUser();
                if (!bot) {
                    continue;
                }

                // if the sender is the bot just ignore it

                if (bot.id === data.sender.id) {
                    continue;
                }
                // if the user doesnt belong to the room ignore it
                if (!data.room.userIds.includes(bot.id)) {
                    continue;
                }

                await app.call(AppMethod.EXECUTEPOSTMESSAGESENTTOBOT, data);
            }
        }

        for (const appId of this.listeners.get(AppInterface.IPostMessageSent)) {
            const app = this.manager.getOneById(appId);

            const continueOn = (await app.call(AppMethod.CHECKPOSTMESSAGESENT, data).catch((error) => {
                // This method is optional, so if it doesn't exist, we should continue
                if (error?.code === JSONRPC_METHOD_NOT_FOUND) {
                    return true;
                }

                throw error;
            })) as boolean;

            if (continueOn) {
                await app.call(AppMethod.EXECUTEPOSTMESSAGESENT, data);
            }
        }
    }

    private async executePostSystemMessageSent(data: IMessage): Promise<void> {
        for (const appId of this.listeners.get(AppInterface.IPostSystemMessageSent)) {
            const app = this.manager.getOneById(appId);
            await app.call(AppMethod.EXECUTEPOSTSYSTEMMESSAGESENT, data);
        }
    }

    private async executePreMessageDeletePrevent(data: IMessage): Promise<boolean> {
        let prevented = false;

        for (const appId of this.listeners.get(AppInterface.IPreMessageDeletePrevent)) {
            const app = this.manager.getOneById(appId);

            const continueOn = (await app.call(AppMethod.CHECKPREMESSAGEDELETEPREVENT, data).catch((error) => {
                // This method is optional, so if it doesn't exist, we should continue
                if (error?.code === JSONRPC_METHOD_NOT_FOUND) {
                    return true;
                }

                throw error;
            })) as boolean;

            if (continueOn) {
                prevented = (await app.call(AppMethod.EXECUTEPREMESSAGEDELETEPREVENT, data)) as boolean;

                if (prevented) {
                    return prevented;
                }
            }
        }

        return prevented;
    }

    private async executePostMessageDelete(data: IMessageDeleteContext): Promise<void> {
        const context = Utilities.deepCloneAndFreeze(data);
        const { message } = context;

        for (const appId of this.listeners.get(AppInterface.IPostMessageDeleted)) {
            const app = this.manager.getOneById(appId);

            const continueOn = (await app
                .call(
                    AppMethod.CHECKPOSTMESSAGEDELETED,
                    // `context` has more information about the event, but
                    // we had to keep this `message` here for compatibility
                    message,
                    context,
                )
                .catch((error) => {
                    // This method is optional, so if it doesn't exist, we should continue
                    if (error?.code === JSONRPC_METHOD_NOT_FOUND) {
                        return true;
                    }

                    throw error;
                })) as boolean;

            if (continueOn) {
                await app.call(AppMethod.EXECUTEPOSTMESSAGEDELETED, message, context);
            }
        }
    }

    private async executePreMessageUpdatedPrevent(data: IMessage): Promise<boolean> {
        let prevented = false;

        for (const appId of this.listeners.get(AppInterface.IPreMessageUpdatedPrevent)) {
            const app = this.manager.getOneById(appId);

            const continueOn = (await app.call(AppMethod.CHECKPREMESSAGEUPDATEDPREVENT, data).catch((error) => {
                // This method is optional, so if it doesn't exist, we should continue
                if (error?.code === JSONRPC_METHOD_NOT_FOUND) {
                    return true;
                }

                throw error;
            })) as boolean;

            if (continueOn) {
                prevented = (await app.call(AppMethod.EXECUTEPREMESSAGEUPDATEDPREVENT, data)) as boolean;

                if (prevented) {
                    return prevented;
                }
            }
        }

        return prevented;
    }

    private async executePreMessageUpdatedExtend(data: IMessage): Promise<IMessage> {
        let msg = data;

        for (const appId of this.listeners.get(AppInterface.IPreMessageUpdatedExtend)) {
            const app = this.manager.getOneById(appId);

            const continueOn = (await app.call(AppMethod.CHECKPREMESSAGEUPDATEDEXTEND, msg).catch((error) => {
                // This method is optional, so if it doesn't exist, we should continue
                if (error?.code === JSONRPC_METHOD_NOT_FOUND) {
                    return true;
                }

                throw error;
            })) as boolean;

            if (continueOn) {
                msg = await app.call(AppMethod.EXECUTEPREMESSAGEUPDATEDEXTEND, msg);
            }
        }

        return msg;
    }

    private async executePreMessageUpdatedModify(data: IMessage): Promise<IMessage> {
        let msg = data;

        for (const appId of this.listeners.get(AppInterface.IPreMessageUpdatedModify)) {
            const app = this.manager.getOneById(appId);

            const continueOn = (await app.call(AppMethod.CHECKPREMESSAGEUPDATEDMODIFY, msg).catch((error) => {
                // This method is optional, so if it doesn't exist, we should continue
                if (error?.code === JSONRPC_METHOD_NOT_FOUND) {
                    return true;
                }

                throw error;
            })) as boolean;

            if (continueOn) {
                msg = (await app.call(AppMethod.EXECUTEPREMESSAGEUPDATEDMODIFY, msg)) as IMessage;
            }
        }

        return msg;
    }

    private async executePostMessageUpdated(data: IMessage): Promise<void> {
        for (const appId of this.listeners.get(AppInterface.IPostMessageUpdated)) {
            const app = this.manager.getOneById(appId);

            const continueOn = (await app.call(AppMethod.CHECKPOSTMESSAGEUPDATED, data).catch((error) => {
                // This method is optional, so if it doesn't exist, we should continue
                if (error?.code === JSONRPC_METHOD_NOT_FOUND) {
                    return true;
                }

                throw error;
            })) as boolean;

            if (continueOn) {
                await app.call(AppMethod.EXECUTEPOSTMESSAGEUPDATED, data);
            }
        }
    }

    // Rooms
    private async executePreRoomCreatePrevent(data: IRoom): Promise<boolean> {
        let prevented = false;

        for (const appId of this.listeners.get(AppInterface.IPreRoomCreatePrevent)) {
            const app = this.manager.getOneById(appId);

            const continueOn = (await app.call(AppMethod.CHECKPREROOMCREATEPREVENT, data).catch((error) => {
                // This method is optional, so if it doesn't exist, we should continue
                if (error?.code === JSONRPC_METHOD_NOT_FOUND) {
                    return true;
                }

                throw error;
            })) as boolean;

            if (continueOn) {
                prevented = (await app.call(AppMethod.EXECUTEPREROOMCREATEPREVENT, data)) as boolean;

                if (prevented) {
                    return prevented;
                }
            }
        }

        return prevented;
    }

    private async executePreRoomCreateExtend(data: IRoom): Promise<IRoom> {
        let room = data;

        for (const appId of this.listeners.get(AppInterface.IPreRoomCreateExtend)) {
            const app = this.manager.getOneById(appId);

            const continueOn = (await app.call(AppMethod.CHECKPREROOMCREATEEXTEND, room).catch((error) => {
                // This method is optional, so if it doesn't exist, we should continue
                if (error?.code === JSONRPC_METHOD_NOT_FOUND) {
                    return true;
                }

                throw error;
            })) as boolean;

            if (continueOn) {
                room = await app.call(AppMethod.EXECUTEPREROOMCREATEEXTEND, room);
            }
        }

        return room;
    }

    private async executePreRoomCreateModify(data: IRoom): Promise<IRoom> {
        let room = data;

        for (const appId of this.listeners.get(AppInterface.IPreRoomCreateModify)) {
            const app = this.manager.getOneById(appId);

            const continueOn = (await app.call(AppMethod.CHECKPREROOMCREATEMODIFY, room).catch((error) => {
                // This method is optional, so if it doesn't exist, we should continue
                if (error?.code === JSONRPC_METHOD_NOT_FOUND) {
                    return true;
                }

                throw error;
            })) as boolean;

            if (continueOn) {
                room = (await app.call(AppMethod.EXECUTEPREROOMCREATEMODIFY, room)) as IRoom;
            }
        }

        return room;
    }

    private async executePostRoomCreate(data: IRoom): Promise<void> {
        for (const appId of this.listeners.get(AppInterface.IPostRoomCreate)) {
            const app = this.manager.getOneById(appId);

            const continueOn = (await app.call(AppMethod.CHECKPOSTROOMCREATE, data).catch((error) => {
                // This method is optional, so if it doesn't exist, we should continue
                if (error?.code === JSONRPC_METHOD_NOT_FOUND) {
                    return true;
                }

                throw error;
            })) as boolean;

            if (continueOn) {
                await app.call(AppMethod.EXECUTEPOSTROOMCREATE, data);
            }
        }
    }

    private async executePreRoomDeletePrevent(data: IRoom): Promise<boolean> {
        let prevented = false;

        for (const appId of this.listeners.get(AppInterface.IPreRoomDeletePrevent)) {
            const app = this.manager.getOneById(appId);

            const continueOn = (await app.call(AppMethod.CHECKPREROOMDELETEPREVENT, data).catch((error) => {
                // This method is optional, so if it doesn't exist, we should continue
                if (error?.code === JSONRPC_METHOD_NOT_FOUND) {
                    return true;
                }

                throw error;
            })) as boolean;

            if (continueOn) {
                prevented = (await app.call(AppMethod.EXECUTEPREROOMDELETEPREVENT, data)) as boolean;

                if (prevented) {
                    return prevented;
                }
            }
        }

        return prevented;
    }

    private async executePostRoomDeleted(data: IRoom): Promise<void> {
        for (const appId of this.listeners.get(AppInterface.IPostRoomDeleted)) {
            const app = this.manager.getOneById(appId);

            const continueOn = (await app.call(AppMethod.CHECKPOSTROOMDELETED, data).catch((error) => {
                // This method is optional, so if it doesn't exist, we should continue
                if (error?.code === JSONRPC_METHOD_NOT_FOUND) {
                    return true;
                }

                throw error;
            })) as boolean;

            if (continueOn) {
                await app.call(AppMethod.EXECUTEPOSTROOMDELETED, data);
            }
        }
    }

    private async executePreRoomUserJoined(externalData: IRoomUserJoinedContext): Promise<void> {
        for (const appId of this.listeners.get(AppInterface.IPreRoomUserJoined)) {
            const app = this.manager.getOneById(appId);

            await app.call(AppMethod.EXECUTE_PRE_ROOM_USER_JOINED, externalData);
        }
    }

    private async executePostRoomUserJoined(externalData: IRoomUserJoinedContext): Promise<void> {
        for (const appId of this.listeners.get(AppInterface.IPostRoomUserJoined)) {
            const app = this.manager.getOneById(appId);

            await app.call(AppMethod.EXECUTE_POST_ROOM_USER_JOINED, externalData);
        }
    }

    private async executePreRoomUserLeave(externalData: IRoomUserLeaveContext): Promise<void> {
        for (const appId of this.listeners.get(AppInterface.IPreRoomUserLeave)) {
            const app = this.manager.getOneById(appId);

            await app.call(AppMethod.EXECUTE_PRE_ROOM_USER_LEAVE, externalData);
        }
    }

    private async executePostRoomUserLeave(externalData: IRoomUserLeaveContext): Promise<void> {
        for (const appId of this.listeners.get(AppInterface.IPostRoomUserLeave)) {
            const app = this.manager.getOneById(appId);

            await app.call(AppMethod.EXECUTE_POST_ROOM_USER_LEAVE, externalData);
        }
    }

    // External Components
    private async executePostExternalComponentOpened(data: IExternalComponent): Promise<void> {
        for (const appId of this.listeners.get(AppInterface.IPostExternalComponentOpened)) {
            const app = this.manager.getOneById(appId);

            await app.call(AppMethod.EXECUTEPOSTEXTERNALCOMPONENTOPENED, data);
        }
    }

    private async executePostExternalComponentClosed(data: IExternalComponent): Promise<void> {
        for (const appId of this.listeners.get(AppInterface.IPostExternalComponentClosed)) {
            const app = this.manager.getOneById(appId);

            await app.call(AppMethod.EXECUTEPOSTEXTERNALCOMPONENTCLOSED, data);
        }
    }

    private async executeUIKitInteraction(data: UIKitIncomingInteraction): Promise<IUIKitResponse> {
        const { appId } = data;

        const app = this.manager.getOneById(appId);
        const handleError = (method: string) => (error: unknown) => {
            if ((error as Record<string, number>)?.code === JSONRPC_METHOD_NOT_FOUND) {
                if (this.defaultHandlers.has(method)) {
                    console.warn(
                        `App ${appId} triggered an interaction but it doesn't exist or doesn't have method ${method}. Falling back to default handler.`,
                    );
                    return this.defaultHandlers.get(method);
                }

                console.warn(
                    `App ${appId} triggered an interaction but it doesn't exist or doesn't have method ${method} and there is no default handler for it.`,
                );
                return;
            }

            throw error;
        };

        const { actionId, user, triggerId } = data;

        switch (data.type) {
            case UIKitIncomingInteractionType.BLOCK: {
                const method = 'executeBlockActionHandler';
                const { value, blockId } = data.payload as { value: string; blockId: string };

                return app
                    .call(method, {
                        appId,
                        actionId,
                        blockId,
                        user,
                        room: data.room,
                        triggerId,
                        value,
                        message: data.message,
                        container: data.container,
                    })
                    .catch(handleError(method));
            }
            case UIKitIncomingInteractionType.VIEW_SUBMIT: {
                const method = 'executeViewSubmitHandler';
                const { view } = data.payload as { view: IUIKitSurface };

                return app
                    .call(method, {
                        appId,
                        actionId,
                        view,
                        room: data.room,
                        triggerId,
                        user,
                    })
                    .catch(handleError(method));
            }
            case UIKitIncomingInteractionType.VIEW_CLOSED: {
                const method = 'executeViewClosedHandler';
                const { view, isCleared } = data.payload as { view: IUIKitSurface; isCleared: boolean };

                return app
                    .call(method, {
                        appId,
                        actionId,
                        view,
                        room: data.room,
                        isCleared,
                        user,
                    })
                    .catch(handleError(method));
            }
            case 'actionButton': {
                const method = 'executeActionButtonHandler';

                if (isUIKitIncomingInteractionActionButtonMessageBox(data)) {
                    return app
                        .call(method, {
                            appId,
                            actionId,
                            buttonContext: UIActionButtonContext.MESSAGE_BOX_ACTION,
                            room: data.room,
                            triggerId,
                            user,
                            threadId: data.tmid,
                            ...('message' in data.payload && { text: data.payload.message }),
                        })
                        .catch(handleError(method));
                }

                return app
                    .call(method, {
                        appId,
                        actionId,
                        triggerId,
                        buttonContext: data.payload.context as UIActionButtonContext,
                        room: ('room' in data && data.room) || undefined,
                        user,
                        ...('message' in data && { message: data.message }),
                    })
                    .catch(handleError(method));
            }
        }
    }

    private async executeUIKitLivechatInteraction(data: IUIKitLivechatIncomingInteraction): Promise<IUIKitResponse> {
        const { appId, type } = data;

        const method = ((interactionType: string) => {
            switch (interactionType) {
                case UIKitIncomingInteractionType.BLOCK:
                    return AppMethod.UIKIT_LIVECHAT_BLOCK_ACTION;
            }
        })(type);

        const app = this.manager.getOneById(appId);

        const interactionData = ((
            interactionType: UIKitIncomingInteractionType,
            interaction: IUIKitLivechatIncomingInteraction,
        ): IUIKitLivechatBlockIncomingInteraction => {
            const { actionId, message, visitor, room, triggerId, container } = interaction;

            switch (interactionType) {
                case UIKitIncomingInteractionType.BLOCK: {
                    const { value, blockId } = interaction.payload as { value: string; blockId: string };

                    return {
                        appId,
                        actionId,
                        blockId,
                        visitor,
                        room,
                        triggerId,
                        value,
                        message,
                        container: container as IUIKitIncomingInteractionModalContainer | IUIKitIncomingInteractionMessageContainer,
                    };
                }
            }
        })(type, data);

        return app.call(method, interactionData);
    }

    // Livechat
    private async executePreLivechatRoomCreatePrevent(data: ILivechatRoom): Promise<void> {
        for (const appId of this.listeners.get(AppInterface.IPreLivechatRoomCreatePrevent)) {
            const app = this.manager.getOneById(appId);

            await app.call(AppMethod.EXECUTE_PRE_LIVECHAT_ROOM_CREATE_PREVENT, data);
        }
    }

    private async executePostLivechatRoomStarted(data: ILivechatRoom): Promise<void> {
        for (const appId of this.listeners.get(AppInterface.IPostLivechatRoomStarted)) {
            const app = this.manager.getOneById(appId);

            await app.call(AppMethod.EXECUTE_POST_LIVECHAT_ROOM_STARTED, data);
        }
    }

    private async executeLivechatRoomClosedHandler(data: ILivechatRoom): Promise<void> {
        for (const appId of this.listeners.get(AppInterface.ILivechatRoomClosedHandler)) {
            const app = this.manager.getOneById(appId);

            await app.call(AppMethod.EXECUTE_LIVECHAT_ROOM_CLOSED_HANDLER, data);
        }
    }

    private async executePostLivechatRoomClosed(data: ILivechatRoom): Promise<void> {
        for (const appId of this.listeners.get(AppInterface.IPostLivechatRoomClosed)) {
            const app = this.manager.getOneById(appId);

            await app.call(AppMethod.EXECUTE_POST_LIVECHAT_ROOM_CLOSED, data);
        }
    }

    private async executePostLivechatAgentAssigned(data: ILivechatEventContext): Promise<void> {
        for (const appId of this.listeners.get(AppInterface.IPostLivechatAgentAssigned)) {
            const app = this.manager.getOneById(appId);

            await app.call(AppMethod.EXECUTE_POST_LIVECHAT_AGENT_ASSIGNED, data);
        }
    }

    private async executePostLivechatAgentUnassigned(data: ILivechatEventContext): Promise<void> {
        for (const appId of this.listeners.get(AppInterface.IPostLivechatAgentUnassigned)) {
            const app = this.manager.getOneById(appId);

            await app.call(AppMethod.EXECUTE_POST_LIVECHAT_AGENT_UNASSIGNED, data);
        }
    }

    private async executePostLivechatRoomTransferred(data: ILivechatTransferEventContext): Promise<void> {
        for (const appId of this.listeners.get(AppInterface.IPostLivechatRoomTransferred)) {
            const app = this.manager.getOneById(appId);

            await app.call(AppMethod.EXECUTE_POST_LIVECHAT_ROOM_TRANSFERRED, data);
        }
    }

    private async executePostLivechatGuestSaved(data: IVisitor): Promise<void> {
        for (const appId of this.listeners.get(AppInterface.IPostLivechatGuestSaved)) {
            const app = this.manager.getOneById(appId);

            await app.call(AppMethod.EXECUTE_POST_LIVECHAT_GUEST_SAVED, data);
        }
    }

    private async executePostLivechatRoomSaved(data: ILivechatRoom): Promise<void> {
        for (const appId of this.listeners.get(AppInterface.IPostLivechatRoomSaved)) {
            const app = this.manager.getOneById(appId);

            await app.call(AppMethod.EXECUTE_POST_LIVECHAT_ROOM_SAVED, data);
        }
    }

    private async executePostLivechatDepartmentRemoved(data: ILivechatDepartmentEventContext): Promise<void> {
        for (const appId of this.listeners.get(AppInterface.IPostLivechatDepartmentRemoved)) {
            const app = this.manager.getOneById(appId);

            await app.call(AppMethod.EXECUTE_POST_LIVECHAT_DEPARTMENT_REMOVED, data);
        }
    }

    private async executePostLivechatDepartmentDisabled(data: ILivechatDepartmentEventContext): Promise<void> {
        for (const appId of this.listeners.get(AppInterface.IPostLivechatDepartmentDisabled)) {
            const app = this.manager.getOneById(appId);

            await app.call(AppMethod.EXECUTE_POST_LIVECHAT_DEPARTMENT_DISABLED, data);
        }
    }

    // FileUpload
    private async executePreFileUpload(data: IFileUploadContext): Promise<void> {
        for (const appId of this.listeners.get(AppInterface.IPreFileUpload)) {
            const app = this.manager.getOneById(appId);

            await app.call(AppMethod.EXECUTE_PRE_FILE_UPLOAD, data);
        }
    }

    private async executePreEmailSent(data: IPreEmailSentContext): Promise<IEmailDescriptor> {
        let descriptor = data.email;

        for (const appId of this.listeners.get(AppInterface.IPreEmailSent)) {
            const app = this.manager.getOneById(appId);

            descriptor = await app.call(AppMethod.EXECUTE_PRE_EMAIL_SENT, {
                context: data.context,
                email: descriptor,
            });
        }

        return descriptor;
    }

    private async executePostMessageReacted(data: IMessageReactionContext): Promise<void> {
        for (const appId of this.listeners.get(AppInterface.IPostMessageReacted)) {
            const app = this.manager.getOneById(appId);

            await app.call(AppMethod.EXECUTE_POST_MESSAGE_REACTED, data);
        }
    }

    private async executePostMessageFollowed(data: IMessageFollowContext): Promise<void> {
        for (const appId of this.listeners.get(AppInterface.IPostMessageFollowed)) {
            const app = this.manager.getOneById(appId);

            await app.call(AppMethod.EXECUTE_POST_MESSAGE_FOLLOWED, data);
        }
    }

    private async executePostMessagePinned(data: IMessagePinContext): Promise<void> {
        for (const appId of this.listeners.get(AppInterface.IPostMessagePinned)) {
            const app = this.manager.getOneById(appId);

            await app.call(AppMethod.EXECUTE_POST_MESSAGE_PINNED, data);
        }
    }

    private async executePostMessageStarred(data: IMessageStarContext): Promise<void> {
        for (const appId of this.listeners.get(AppInterface.IPostMessageStarred)) {
            const app = this.manager.getOneById(appId);

            await app.call(AppMethod.EXECUTE_POST_MESSAGE_STARRED, data);
        }
    }

    private async executePostMessageReported(data: IMessageReportContext): Promise<void> {
        for (const appId of this.listeners.get(AppInterface.IPostMessageReported)) {
            const app = this.manager.getOneById(appId);

            await app.call(AppMethod.EXECUTE_POST_MESSAGE_REPORTED, data);
        }
    }

    private async executePostUserCreated(data: IUserContext): Promise<void> {
        for (const appId of this.listeners.get(AppInterface.IPostUserCreated)) {
            const app = this.manager.getOneById(appId);

            await app.call(AppMethod.EXECUTE_POST_USER_CREATED, data);
        }
    }

    private async executePostUserUpdated(data: IUserUpdateContext): Promise<void> {
        for (const appId of this.listeners.get(AppInterface.IPostUserUpdated)) {
            const app = this.manager.getOneById(appId);

            await app.call(AppMethod.EXECUTE_POST_USER_UPDATED, data);
        }
    }

    private async executePostUserDeleted(data: IUserContext): Promise<void> {
        for (const appId of this.listeners.get(AppInterface.IPostUserDeleted)) {
            const app = this.manager.getOneById(appId);

            await app.call(AppMethod.EXECUTE_POST_USER_DELETED, data);
        }
    }

    private async executePostUserLoggedIn(data: IUser): Promise<void> {
        for (const appId of this.listeners.get(AppInterface.IPostUserLoggedIn)) {
            const app = this.manager.getOneById(appId);

            await app.call(AppMethod.EXECUTE_POST_USER_LOGGED_IN, data);
        }
    }

    private async executePostUserLoggedOut(data: IUser): Promise<void> {
        for (const appId of this.listeners.get(AppInterface.IPostUserLoggedOut)) {
            const app = this.manager.getOneById(appId);

            await app.call(AppMethod.EXECUTE_POST_USER_LOGGED_OUT, data);
        }
    }

    private async executePostUserStatusChanged(data: IUserStatusContext): Promise<void> {
        for (const appId of this.listeners.get(AppInterface.IPostUserStatusChanged)) {
            const app = this.manager.getOneById(appId);

            await app.call(AppMethod.EXECUTE_POST_USER_STATUS_CHANGED, data);
        }
    }
}
