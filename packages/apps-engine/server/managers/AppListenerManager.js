"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppListenerManager = void 0;
const exceptions_1 = require("../../definition/exceptions");
const metadata_1 = require("../../definition/metadata");
const rooms_1 = require("../../definition/rooms");
const ui_1 = require("../../definition/ui");
const uikit_1 = require("../../definition/uikit");
const IUIKitIncomingInteractionActionButton_1 = require("../../definition/uikit/IUIKitIncomingInteractionActionButton");
const Utilities_1 = require("../misc/Utilities");
const AppsEngineDenoRuntime_1 = require("../runtime/deno/AppsEngineDenoRuntime");
// type EventReturn = void | boolean | IMessage | IRoom | IUser | IUIKitResponse | ILivechatRoom | IEmailDescriptor;
class AppListenerManager {
    constructor(manager) {
        this.manager = manager;
        this.defaultHandlers = new Map();
        this.am = manager.getAccessorManager();
        this.listeners = new Map();
        this.lockedEvents = new Map();
        Object.keys(metadata_1.AppInterface).forEach((intt) => {
            this.listeners.set(intt, []);
            this.lockedEvents.set(intt, new Set());
        });
        this.defaultHandlers.set('executeViewClosedHandler', { success: true });
    }
    registerListeners(app) {
        this.unregisterListeners(app);
        Object.entries(app.getImplementationList()).forEach(([event, isImplemented]) => {
            if (!isImplemented) {
                return;
            }
            this.listeners.get(event).push(app.getID());
        });
    }
    unregisterListeners(app) {
        this.listeners.forEach((apps, int) => {
            if (apps.includes(app.getID())) {
                const where = apps.indexOf(app.getID());
                this.listeners.get(int).splice(where, 1);
            }
        });
    }
    releaseEssentialEvents(app) {
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
    lockEssentialEvents(app) {
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
    getListeners(int) {
        const results = [];
        for (const appId of this.listeners.get(int)) {
            results.push(this.manager.getOneById(appId));
        }
        return results;
    }
    isEventBlocked(event) {
        const lockedEventList = this.lockedEvents.get(event);
        return !!(lockedEventList && lockedEventList.size);
    }
    executeListener(int, data) {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.isEventBlocked(int)) {
                throw new exceptions_1.EssentialAppDisabledException('There is one or more apps that are essential to this event but are disabled');
            }
            switch (int) {
                // Messages
                case metadata_1.AppInterface.IPreMessageSentPrevent:
                    return this.executePreMessageSentPrevent(data);
                case metadata_1.AppInterface.IPreMessageSentExtend:
                    return this.executePreMessageSentExtend(data);
                case metadata_1.AppInterface.IPreMessageSentModify:
                    return this.executePreMessageSentModify(data);
                case metadata_1.AppInterface.IPostMessageSent:
                    this.executePostMessageSent(data);
                    return;
                case metadata_1.AppInterface.IPreMessageDeletePrevent:
                    return this.executePreMessageDeletePrevent(data);
                case metadata_1.AppInterface.IPostMessageDeleted:
                    this.executePostMessageDelete(data);
                    return;
                case metadata_1.AppInterface.IPreMessageUpdatedPrevent:
                    return this.executePreMessageUpdatedPrevent(data);
                case metadata_1.AppInterface.IPreMessageUpdatedExtend:
                    return this.executePreMessageUpdatedExtend(data);
                case metadata_1.AppInterface.IPreMessageUpdatedModify:
                    return this.executePreMessageUpdatedModify(data);
                case metadata_1.AppInterface.IPostMessageUpdated:
                    this.executePostMessageUpdated(data);
                    return;
                case metadata_1.AppInterface.IPostMessageReacted:
                    return this.executePostMessageReacted(data);
                case metadata_1.AppInterface.IPostMessageFollowed:
                    return this.executePostMessageFollowed(data);
                case metadata_1.AppInterface.IPostMessagePinned:
                    return this.executePostMessagePinned(data);
                case metadata_1.AppInterface.IPostMessageStarred:
                    return this.executePostMessageStarred(data);
                case metadata_1.AppInterface.IPostMessageReported:
                    return this.executePostMessageReported(data);
                // Rooms
                case metadata_1.AppInterface.IPreRoomCreatePrevent:
                    return this.executePreRoomCreatePrevent(data);
                case metadata_1.AppInterface.IPreRoomCreateExtend:
                    return this.executePreRoomCreateExtend(data);
                case metadata_1.AppInterface.IPreRoomCreateModify:
                    return this.executePreRoomCreateModify(data);
                case metadata_1.AppInterface.IPostRoomCreate:
                    this.executePostRoomCreate(data);
                    return;
                case metadata_1.AppInterface.IPreRoomDeletePrevent:
                    return this.executePreRoomDeletePrevent(data);
                case metadata_1.AppInterface.IPostRoomDeleted:
                    this.executePostRoomDeleted(data);
                    return;
                case metadata_1.AppInterface.IPreRoomUserJoined:
                    return this.executePreRoomUserJoined(data);
                case metadata_1.AppInterface.IPostRoomUserJoined:
                    return this.executePostRoomUserJoined(data);
                case metadata_1.AppInterface.IPreRoomUserLeave:
                    return this.executePreRoomUserLeave(data);
                case metadata_1.AppInterface.IPostRoomUserLeave:
                    return this.executePostRoomUserLeave(data);
                // External Components
                case metadata_1.AppInterface.IPostExternalComponentOpened:
                    this.executePostExternalComponentOpened(data);
                    return;
                case metadata_1.AppInterface.IPostExternalComponentClosed:
                    this.executePostExternalComponentClosed(data);
                    return;
                case metadata_1.AppInterface.IUIKitInteractionHandler:
                    return this.executeUIKitInteraction(data);
                case metadata_1.AppInterface.IUIKitLivechatInteractionHandler:
                    return this.executeUIKitLivechatInteraction(data);
                // Livechat
                case metadata_1.AppInterface.IPostLivechatRoomStarted:
                    return this.executePostLivechatRoomStarted(data);
                /**
                 * @deprecated please prefer the AppInterface.IPostLivechatRoomClosed event
                 */
                case metadata_1.AppInterface.ILivechatRoomClosedHandler:
                    return this.executeLivechatRoomClosedHandler(data);
                case metadata_1.AppInterface.IPostLivechatRoomClosed:
                    return this.executePostLivechatRoomClosed(data);
                case metadata_1.AppInterface.IPostLivechatRoomSaved:
                    return this.executePostLivechatRoomSaved(data);
                case metadata_1.AppInterface.IPostLivechatAgentAssigned:
                    return this.executePostLivechatAgentAssigned(data);
                case metadata_1.AppInterface.IPostLivechatAgentUnassigned:
                    return this.executePostLivechatAgentUnassigned(data);
                case metadata_1.AppInterface.IPostLivechatRoomTransferred:
                    return this.executePostLivechatRoomTransferred(data);
                case metadata_1.AppInterface.IPostLivechatGuestSaved:
                    return this.executePostLivechatGuestSaved(data);
                // FileUpload
                case metadata_1.AppInterface.IPreFileUpload:
                    return this.executePreFileUpload(data);
                // Email
                case metadata_1.AppInterface.IPreEmailSent:
                    return this.executePreEmailSent(data);
                // User
                case metadata_1.AppInterface.IPostUserCreated:
                    return this.executePostUserCreated(data);
                case metadata_1.AppInterface.IPostUserUpdated:
                    return this.executePostUserUpdated(data);
                case metadata_1.AppInterface.IPostUserDeleted:
                    return this.executePostUserDeleted(data);
                case metadata_1.AppInterface.IPostUserLoggedIn:
                    return this.executePostUserLoggedIn(data);
                case metadata_1.AppInterface.IPostUserLoggedOut:
                    return this.executePostUserLoggedOut(data);
                case metadata_1.AppInterface.IPostUserStatusChanged:
                    return this.executePostUserStatusChanged(data);
                default:
                    console.warn('An invalid listener was called');
            }
        });
    }
    // Messages
    executePreMessageSentPrevent(data) {
        return __awaiter(this, void 0, void 0, function* () {
            let prevented = false;
            for (const appId of this.listeners.get(metadata_1.AppInterface.IPreMessageSentPrevent)) {
                const app = this.manager.getOneById(appId);
                const continueOn = (yield app.call(metadata_1.AppMethod.CHECKPREMESSAGESENTPREVENT, data).catch((error) => {
                    // This method is optional, so if it doesn't exist, we should continue
                    if ((error === null || error === void 0 ? void 0 : error.code) === AppsEngineDenoRuntime_1.JSONRPC_METHOD_NOT_FOUND) {
                        return true;
                    }
                    throw error;
                }));
                if (!continueOn) {
                    continue;
                }
                prevented = (yield app.call(metadata_1.AppMethod.EXECUTEPREMESSAGESENTPREVENT, data));
                if (prevented) {
                    return prevented;
                }
            }
            return prevented;
        });
    }
    executePreMessageSentExtend(data) {
        return __awaiter(this, void 0, void 0, function* () {
            let msg = data;
            for (const appId of this.listeners.get(metadata_1.AppInterface.IPreMessageSentExtend)) {
                const app = this.manager.getOneById(appId);
                const continueOn = (yield app.call(metadata_1.AppMethod.CHECKPREMESSAGESENTEXTEND, data).catch((error) => {
                    // This method is optional, so if it doesn't exist, we should continue
                    if ((error === null || error === void 0 ? void 0 : error.code) === AppsEngineDenoRuntime_1.JSONRPC_METHOD_NOT_FOUND) {
                        return true;
                    }
                    throw error;
                }));
                if (continueOn) {
                    msg = yield app.call(metadata_1.AppMethod.EXECUTEPREMESSAGESENTEXTEND, msg);
                }
            }
            return msg;
        });
    }
    executePreMessageSentModify(data) {
        return __awaiter(this, void 0, void 0, function* () {
            let msg = data;
            for (const appId of this.listeners.get(metadata_1.AppInterface.IPreMessageSentModify)) {
                const app = this.manager.getOneById(appId);
                const continueOn = (yield app.call(metadata_1.AppMethod.CHECKPREMESSAGESENTMODIFY, msg).catch((error) => {
                    // This method is optional, so if it doesn't exist, we should continue
                    if ((error === null || error === void 0 ? void 0 : error.code) === AppsEngineDenoRuntime_1.JSONRPC_METHOD_NOT_FOUND) {
                        return true;
                    }
                    throw error;
                }));
                if (continueOn) {
                    msg = (yield app.call(metadata_1.AppMethod.EXECUTEPREMESSAGESENTMODIFY, msg));
                }
            }
            return msg;
        });
    }
    executePostMessageSent(data) {
        return __awaiter(this, void 0, void 0, function* () {
            // First check if the app implements Bot DM handlers and check if the dm contains more than one user
            if (data.room.type === rooms_1.RoomType.DIRECT_MESSAGE && data.room.userIds.length > 1) {
                for (const appId of this.listeners.get(metadata_1.AppInterface.IPostMessageSentToBot)) {
                    const app = this.manager.getOneById(appId);
                    const reader = this.am.getReader(appId);
                    const bot = yield reader.getUserReader().getAppUser();
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
                    yield app.call(metadata_1.AppMethod.EXECUTEPOSTMESSAGESENTTOBOT, data);
                }
            }
            for (const appId of this.listeners.get(metadata_1.AppInterface.IPostMessageSent)) {
                const app = this.manager.getOneById(appId);
                const continueOn = (yield app.call(metadata_1.AppMethod.CHECKPOSTMESSAGESENT, data).catch((error) => {
                    // This method is optional, so if it doesn't exist, we should continue
                    if ((error === null || error === void 0 ? void 0 : error.code) === AppsEngineDenoRuntime_1.JSONRPC_METHOD_NOT_FOUND) {
                        return true;
                    }
                    throw error;
                }));
                if (continueOn) {
                    yield app.call(metadata_1.AppMethod.EXECUTEPOSTMESSAGESENT, data);
                }
            }
        });
    }
    executePreMessageDeletePrevent(data) {
        return __awaiter(this, void 0, void 0, function* () {
            let prevented = false;
            for (const appId of this.listeners.get(metadata_1.AppInterface.IPreMessageDeletePrevent)) {
                const app = this.manager.getOneById(appId);
                const continueOn = (yield app.call(metadata_1.AppMethod.CHECKPREMESSAGEDELETEPREVENT, data).catch((error) => {
                    // This method is optional, so if it doesn't exist, we should continue
                    if ((error === null || error === void 0 ? void 0 : error.code) === AppsEngineDenoRuntime_1.JSONRPC_METHOD_NOT_FOUND) {
                        return true;
                    }
                    throw error;
                }));
                if (continueOn) {
                    prevented = (yield app.call(metadata_1.AppMethod.EXECUTEPREMESSAGEDELETEPREVENT, data));
                    if (prevented) {
                        return prevented;
                    }
                }
            }
            return prevented;
        });
    }
    executePostMessageDelete(data) {
        return __awaiter(this, void 0, void 0, function* () {
            const context = Utilities_1.Utilities.deepCloneAndFreeze(data);
            const { message } = context;
            for (const appId of this.listeners.get(metadata_1.AppInterface.IPostMessageDeleted)) {
                const app = this.manager.getOneById(appId);
                const continueOn = (yield app
                    .call(metadata_1.AppMethod.CHECKPOSTMESSAGEDELETED, 
                // `context` has more information about the event, but
                // we had to keep this `message` here for compatibility
                message, context)
                    .catch((error) => {
                    // This method is optional, so if it doesn't exist, we should continue
                    if ((error === null || error === void 0 ? void 0 : error.code) === AppsEngineDenoRuntime_1.JSONRPC_METHOD_NOT_FOUND) {
                        return true;
                    }
                    throw error;
                }));
                if (continueOn) {
                    yield app.call(metadata_1.AppMethod.EXECUTEPOSTMESSAGEDELETED, message, context);
                }
            }
        });
    }
    executePreMessageUpdatedPrevent(data) {
        return __awaiter(this, void 0, void 0, function* () {
            let prevented = false;
            for (const appId of this.listeners.get(metadata_1.AppInterface.IPreMessageUpdatedPrevent)) {
                const app = this.manager.getOneById(appId);
                const continueOn = (yield app.call(metadata_1.AppMethod.CHECKPREMESSAGEUPDATEDPREVENT, data).catch((error) => {
                    // This method is optional, so if it doesn't exist, we should continue
                    if ((error === null || error === void 0 ? void 0 : error.code) === AppsEngineDenoRuntime_1.JSONRPC_METHOD_NOT_FOUND) {
                        return true;
                    }
                    throw error;
                }));
                if (continueOn) {
                    prevented = (yield app.call(metadata_1.AppMethod.EXECUTEPREMESSAGEUPDATEDPREVENT, data));
                    if (prevented) {
                        return prevented;
                    }
                }
            }
            return prevented;
        });
    }
    executePreMessageUpdatedExtend(data) {
        return __awaiter(this, void 0, void 0, function* () {
            let msg = data;
            for (const appId of this.listeners.get(metadata_1.AppInterface.IPreMessageUpdatedExtend)) {
                const app = this.manager.getOneById(appId);
                const continueOn = (yield app.call(metadata_1.AppMethod.CHECKPREMESSAGEUPDATEDEXTEND, msg).catch((error) => {
                    // This method is optional, so if it doesn't exist, we should continue
                    if ((error === null || error === void 0 ? void 0 : error.code) === AppsEngineDenoRuntime_1.JSONRPC_METHOD_NOT_FOUND) {
                        return true;
                    }
                    throw error;
                }));
                if (continueOn) {
                    msg = yield app.call(metadata_1.AppMethod.EXECUTEPREMESSAGEUPDATEDEXTEND, msg);
                }
            }
            return msg;
        });
    }
    executePreMessageUpdatedModify(data) {
        return __awaiter(this, void 0, void 0, function* () {
            let msg = data;
            for (const appId of this.listeners.get(metadata_1.AppInterface.IPreMessageUpdatedModify)) {
                const app = this.manager.getOneById(appId);
                const continueOn = (yield app.call(metadata_1.AppMethod.CHECKPREMESSAGEUPDATEDMODIFY, msg).catch((error) => {
                    // This method is optional, so if it doesn't exist, we should continue
                    if ((error === null || error === void 0 ? void 0 : error.code) === AppsEngineDenoRuntime_1.JSONRPC_METHOD_NOT_FOUND) {
                        return true;
                    }
                    throw error;
                }));
                if (continueOn) {
                    msg = (yield app.call(metadata_1.AppMethod.EXECUTEPREMESSAGEUPDATEDMODIFY, msg));
                }
            }
            return msg;
        });
    }
    executePostMessageUpdated(data) {
        return __awaiter(this, void 0, void 0, function* () {
            for (const appId of this.listeners.get(metadata_1.AppInterface.IPostMessageUpdated)) {
                const app = this.manager.getOneById(appId);
                const continueOn = (yield app.call(metadata_1.AppMethod.CHECKPOSTMESSAGEUPDATED, data).catch((error) => {
                    // This method is optional, so if it doesn't exist, we should continue
                    if ((error === null || error === void 0 ? void 0 : error.code) === AppsEngineDenoRuntime_1.JSONRPC_METHOD_NOT_FOUND) {
                        return true;
                    }
                    throw error;
                }));
                if (continueOn) {
                    yield app.call(metadata_1.AppMethod.EXECUTEPOSTMESSAGEUPDATED, data);
                }
            }
        });
    }
    // Rooms
    executePreRoomCreatePrevent(data) {
        return __awaiter(this, void 0, void 0, function* () {
            let prevented = false;
            for (const appId of this.listeners.get(metadata_1.AppInterface.IPreRoomCreatePrevent)) {
                const app = this.manager.getOneById(appId);
                const continueOn = (yield app.call(metadata_1.AppMethod.CHECKPREROOMCREATEPREVENT, data).catch((error) => {
                    // This method is optional, so if it doesn't exist, we should continue
                    if ((error === null || error === void 0 ? void 0 : error.code) === AppsEngineDenoRuntime_1.JSONRPC_METHOD_NOT_FOUND) {
                        return true;
                    }
                    throw error;
                }));
                if (continueOn) {
                    prevented = (yield app.call(metadata_1.AppMethod.EXECUTEPREROOMCREATEPREVENT, data));
                    if (prevented) {
                        return prevented;
                    }
                }
            }
            return prevented;
        });
    }
    executePreRoomCreateExtend(data) {
        return __awaiter(this, void 0, void 0, function* () {
            let room = data;
            for (const appId of this.listeners.get(metadata_1.AppInterface.IPreRoomCreateExtend)) {
                const app = this.manager.getOneById(appId);
                const continueOn = (yield app.call(metadata_1.AppMethod.CHECKPREROOMCREATEEXTEND, room).catch((error) => {
                    // This method is optional, so if it doesn't exist, we should continue
                    if ((error === null || error === void 0 ? void 0 : error.code) === AppsEngineDenoRuntime_1.JSONRPC_METHOD_NOT_FOUND) {
                        return true;
                    }
                    throw error;
                }));
                if (continueOn) {
                    room = yield app.call(metadata_1.AppMethod.EXECUTEPREROOMCREATEEXTEND, room);
                }
            }
            return room;
        });
    }
    executePreRoomCreateModify(data) {
        return __awaiter(this, void 0, void 0, function* () {
            let room = data;
            for (const appId of this.listeners.get(metadata_1.AppInterface.IPreRoomCreateModify)) {
                const app = this.manager.getOneById(appId);
                const continueOn = (yield app.call(metadata_1.AppMethod.CHECKPREROOMCREATEMODIFY, room).catch((error) => {
                    // This method is optional, so if it doesn't exist, we should continue
                    if ((error === null || error === void 0 ? void 0 : error.code) === AppsEngineDenoRuntime_1.JSONRPC_METHOD_NOT_FOUND) {
                        return true;
                    }
                    throw error;
                }));
                if (continueOn) {
                    room = (yield app.call(metadata_1.AppMethod.EXECUTEPREROOMCREATEMODIFY, room));
                }
            }
            return data;
        });
    }
    executePostRoomCreate(data) {
        return __awaiter(this, void 0, void 0, function* () {
            for (const appId of this.listeners.get(metadata_1.AppInterface.IPostRoomCreate)) {
                const app = this.manager.getOneById(appId);
                const continueOn = (yield app.call(metadata_1.AppMethod.CHECKPOSTROOMCREATE, data).catch((error) => {
                    // This method is optional, so if it doesn't exist, we should continue
                    if ((error === null || error === void 0 ? void 0 : error.code) === AppsEngineDenoRuntime_1.JSONRPC_METHOD_NOT_FOUND) {
                        return true;
                    }
                    throw error;
                }));
                if (continueOn) {
                    yield app.call(metadata_1.AppMethod.EXECUTEPOSTROOMCREATE, data);
                }
            }
        });
    }
    executePreRoomDeletePrevent(data) {
        return __awaiter(this, void 0, void 0, function* () {
            let prevented = false;
            for (const appId of this.listeners.get(metadata_1.AppInterface.IPreRoomDeletePrevent)) {
                const app = this.manager.getOneById(appId);
                const continueOn = (yield app.call(metadata_1.AppMethod.CHECKPREROOMDELETEPREVENT, data).catch((error) => {
                    // This method is optional, so if it doesn't exist, we should continue
                    if ((error === null || error === void 0 ? void 0 : error.code) === AppsEngineDenoRuntime_1.JSONRPC_METHOD_NOT_FOUND) {
                        return true;
                    }
                    throw error;
                }));
                if (continueOn) {
                    prevented = (yield app.call(metadata_1.AppMethod.EXECUTEPREROOMDELETEPREVENT, data));
                    if (prevented) {
                        return prevented;
                    }
                }
            }
            return prevented;
        });
    }
    executePostRoomDeleted(data) {
        return __awaiter(this, void 0, void 0, function* () {
            for (const appId of this.listeners.get(metadata_1.AppInterface.IPostRoomDeleted)) {
                const app = this.manager.getOneById(appId);
                const continueOn = (yield app.call(metadata_1.AppMethod.CHECKPOSTROOMDELETED, data).catch((error) => {
                    // This method is optional, so if it doesn't exist, we should continue
                    if ((error === null || error === void 0 ? void 0 : error.code) === AppsEngineDenoRuntime_1.JSONRPC_METHOD_NOT_FOUND) {
                        return true;
                    }
                    throw error;
                }));
                if (continueOn) {
                    yield app.call(metadata_1.AppMethod.EXECUTEPOSTROOMDELETED, data);
                }
            }
        });
    }
    executePreRoomUserJoined(externalData) {
        return __awaiter(this, void 0, void 0, function* () {
            for (const appId of this.listeners.get(metadata_1.AppInterface.IPreRoomUserJoined)) {
                const app = this.manager.getOneById(appId);
                yield app.call(metadata_1.AppMethod.EXECUTE_PRE_ROOM_USER_JOINED, externalData);
            }
        });
    }
    executePostRoomUserJoined(externalData) {
        return __awaiter(this, void 0, void 0, function* () {
            for (const appId of this.listeners.get(metadata_1.AppInterface.IPostRoomUserJoined)) {
                const app = this.manager.getOneById(appId);
                yield app.call(metadata_1.AppMethod.EXECUTE_POST_ROOM_USER_JOINED, externalData);
            }
        });
    }
    executePreRoomUserLeave(externalData) {
        return __awaiter(this, void 0, void 0, function* () {
            for (const appId of this.listeners.get(metadata_1.AppInterface.IPreRoomUserLeave)) {
                const app = this.manager.getOneById(appId);
                yield app.call(metadata_1.AppMethod.EXECUTE_PRE_ROOM_USER_LEAVE, externalData);
            }
        });
    }
    executePostRoomUserLeave(externalData) {
        return __awaiter(this, void 0, void 0, function* () {
            for (const appId of this.listeners.get(metadata_1.AppInterface.IPostRoomUserLeave)) {
                const app = this.manager.getOneById(appId);
                yield app.call(metadata_1.AppMethod.EXECUTE_POST_ROOM_USER_LEAVE, externalData);
            }
        });
    }
    // External Components
    executePostExternalComponentOpened(data) {
        return __awaiter(this, void 0, void 0, function* () {
            for (const appId of this.listeners.get(metadata_1.AppInterface.IPostExternalComponentOpened)) {
                const app = this.manager.getOneById(appId);
                yield app.call(metadata_1.AppMethod.EXECUTEPOSTEXTERNALCOMPONENTOPENED, data);
            }
        });
    }
    executePostExternalComponentClosed(data) {
        return __awaiter(this, void 0, void 0, function* () {
            for (const appId of this.listeners.get(metadata_1.AppInterface.IPostExternalComponentClosed)) {
                const app = this.manager.getOneById(appId);
                yield app.call(metadata_1.AppMethod.EXECUTEPOSTEXTERNALCOMPONENTCLOSED, data);
            }
        });
    }
    executeUIKitInteraction(data) {
        return __awaiter(this, void 0, void 0, function* () {
            const { appId } = data;
            const app = this.manager.getOneById(appId);
            const handleError = (method) => (error) => {
                if ((error === null || error === void 0 ? void 0 : error.code) === AppsEngineDenoRuntime_1.JSONRPC_METHOD_NOT_FOUND) {
                    if (this.defaultHandlers.has(method)) {
                        console.warn(`App ${appId} triggered an interaction but it doesn't exist or doesn't have method ${method}. Falling back to default handler.`);
                        return this.defaultHandlers.get(method);
                    }
                    console.warn(`App ${appId} triggered an interaction but it doesn't exist or doesn't have method ${method} and there is no default handler for it.`);
                    return;
                }
                throw error;
            };
            const { actionId, user, triggerId } = data;
            switch (data.type) {
                case uikit_1.UIKitIncomingInteractionType.BLOCK: {
                    const method = 'executeBlockActionHandler';
                    const { value, blockId } = data.payload;
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
                case uikit_1.UIKitIncomingInteractionType.VIEW_SUBMIT: {
                    const method = 'executeViewSubmitHandler';
                    const { view } = data.payload;
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
                case uikit_1.UIKitIncomingInteractionType.VIEW_CLOSED: {
                    const method = 'executeViewClosedHandler';
                    const { view, isCleared } = data.payload;
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
                    if ((0, IUIKitIncomingInteractionActionButton_1.isUIKitIncomingInteractionActionButtonMessageBox)(data)) {
                        return app
                            .call(method, Object.assign({ appId,
                            actionId, buttonContext: ui_1.UIActionButtonContext.MESSAGE_BOX_ACTION, room: data.room, triggerId,
                            user, threadId: data.tmid }, ('message' in data.payload && { text: data.payload.message })))
                            .catch(handleError(method));
                    }
                    return app
                        .call(method, Object.assign({ appId,
                        actionId,
                        triggerId, buttonContext: data.payload.context, room: ('room' in data && data.room) || undefined, user }, ('message' in data && { message: data.message })))
                        .catch(handleError(method));
                }
            }
        });
    }
    executeUIKitLivechatInteraction(data) {
        return __awaiter(this, void 0, void 0, function* () {
            const { appId, type } = data;
            const method = ((interactionType) => {
                switch (interactionType) {
                    case uikit_1.UIKitIncomingInteractionType.BLOCK:
                        return metadata_1.AppMethod.UIKIT_LIVECHAT_BLOCK_ACTION;
                }
            })(type);
            const app = this.manager.getOneById(appId);
            const interactionData = ((interactionType, interaction) => {
                const { actionId, message, visitor, room, triggerId, container } = interaction;
                switch (interactionType) {
                    case uikit_1.UIKitIncomingInteractionType.BLOCK: {
                        const { value, blockId } = interaction.payload;
                        return {
                            appId,
                            actionId,
                            blockId,
                            visitor,
                            room,
                            triggerId,
                            value,
                            message,
                            container: container,
                        };
                    }
                }
            })(type, data);
            return app.call(method, interactionData);
        });
    }
    // Livechat
    executePostLivechatRoomStarted(data) {
        return __awaiter(this, void 0, void 0, function* () {
            for (const appId of this.listeners.get(metadata_1.AppInterface.IPostLivechatRoomStarted)) {
                const app = this.manager.getOneById(appId);
                yield app.call(metadata_1.AppMethod.EXECUTE_POST_LIVECHAT_ROOM_STARTED, data);
            }
        });
    }
    executeLivechatRoomClosedHandler(data) {
        return __awaiter(this, void 0, void 0, function* () {
            for (const appId of this.listeners.get(metadata_1.AppInterface.ILivechatRoomClosedHandler)) {
                const app = this.manager.getOneById(appId);
                yield app.call(metadata_1.AppMethod.EXECUTE_LIVECHAT_ROOM_CLOSED_HANDLER, data);
            }
        });
    }
    executePostLivechatRoomClosed(data) {
        return __awaiter(this, void 0, void 0, function* () {
            for (const appId of this.listeners.get(metadata_1.AppInterface.IPostLivechatRoomClosed)) {
                const app = this.manager.getOneById(appId);
                yield app.call(metadata_1.AppMethod.EXECUTE_POST_LIVECHAT_ROOM_CLOSED, data);
            }
        });
    }
    executePostLivechatAgentAssigned(data) {
        return __awaiter(this, void 0, void 0, function* () {
            for (const appId of this.listeners.get(metadata_1.AppInterface.IPostLivechatAgentAssigned)) {
                const app = this.manager.getOneById(appId);
                yield app.call(metadata_1.AppMethod.EXECUTE_POST_LIVECHAT_AGENT_ASSIGNED, data);
            }
        });
    }
    executePostLivechatAgentUnassigned(data) {
        return __awaiter(this, void 0, void 0, function* () {
            for (const appId of this.listeners.get(metadata_1.AppInterface.IPostLivechatAgentUnassigned)) {
                const app = this.manager.getOneById(appId);
                yield app.call(metadata_1.AppMethod.EXECUTE_POST_LIVECHAT_AGENT_UNASSIGNED, data);
            }
        });
    }
    executePostLivechatRoomTransferred(data) {
        return __awaiter(this, void 0, void 0, function* () {
            for (const appId of this.listeners.get(metadata_1.AppInterface.IPostLivechatRoomTransferred)) {
                const app = this.manager.getOneById(appId);
                yield app.call(metadata_1.AppMethod.EXECUTE_POST_LIVECHAT_ROOM_TRANSFERRED, data);
            }
        });
    }
    executePostLivechatGuestSaved(data) {
        return __awaiter(this, void 0, void 0, function* () {
            for (const appId of this.listeners.get(metadata_1.AppInterface.IPostLivechatGuestSaved)) {
                const app = this.manager.getOneById(appId);
                yield app.call(metadata_1.AppMethod.EXECUTE_POST_LIVECHAT_GUEST_SAVED, data);
            }
        });
    }
    executePostLivechatRoomSaved(data) {
        return __awaiter(this, void 0, void 0, function* () {
            for (const appId of this.listeners.get(metadata_1.AppInterface.IPostLivechatRoomSaved)) {
                const app = this.manager.getOneById(appId);
                yield app.call(metadata_1.AppMethod.EXECUTE_POST_LIVECHAT_ROOM_SAVED, data);
            }
        });
    }
    // FileUpload
    executePreFileUpload(data) {
        return __awaiter(this, void 0, void 0, function* () {
            for (const appId of this.listeners.get(metadata_1.AppInterface.IPreFileUpload)) {
                const app = this.manager.getOneById(appId);
                yield app.call(metadata_1.AppMethod.EXECUTE_PRE_FILE_UPLOAD, data);
            }
        });
    }
    executePreEmailSent(data) {
        return __awaiter(this, void 0, void 0, function* () {
            let descriptor = data.email;
            for (const appId of this.listeners.get(metadata_1.AppInterface.IPreEmailSent)) {
                const app = this.manager.getOneById(appId);
                descriptor = yield app.call(metadata_1.AppMethod.EXECUTE_PRE_EMAIL_SENT, {
                    context: data.context,
                    email: descriptor,
                });
            }
            return descriptor;
        });
    }
    executePostMessageReacted(data) {
        return __awaiter(this, void 0, void 0, function* () {
            for (const appId of this.listeners.get(metadata_1.AppInterface.IPostMessageReacted)) {
                const app = this.manager.getOneById(appId);
                yield app.call(metadata_1.AppMethod.EXECUTE_POST_MESSAGE_REACTED, data);
            }
        });
    }
    executePostMessageFollowed(data) {
        return __awaiter(this, void 0, void 0, function* () {
            for (const appId of this.listeners.get(metadata_1.AppInterface.IPostMessageFollowed)) {
                const app = this.manager.getOneById(appId);
                yield app.call(metadata_1.AppMethod.EXECUTE_POST_MESSAGE_FOLLOWED, data);
            }
        });
    }
    executePostMessagePinned(data) {
        return __awaiter(this, void 0, void 0, function* () {
            for (const appId of this.listeners.get(metadata_1.AppInterface.IPostMessagePinned)) {
                const app = this.manager.getOneById(appId);
                yield app.call(metadata_1.AppMethod.EXECUTE_POST_MESSAGE_PINNED, data);
            }
        });
    }
    executePostMessageStarred(data) {
        return __awaiter(this, void 0, void 0, function* () {
            for (const appId of this.listeners.get(metadata_1.AppInterface.IPostMessageStarred)) {
                const app = this.manager.getOneById(appId);
                yield app.call(metadata_1.AppMethod.EXECUTE_POST_MESSAGE_STARRED, data);
            }
        });
    }
    executePostMessageReported(data) {
        return __awaiter(this, void 0, void 0, function* () {
            for (const appId of this.listeners.get(metadata_1.AppInterface.IPostMessageReported)) {
                const app = this.manager.getOneById(appId);
                yield app.call(metadata_1.AppMethod.EXECUTE_POST_MESSAGE_REPORTED, data);
            }
        });
    }
    executePostUserCreated(data) {
        return __awaiter(this, void 0, void 0, function* () {
            for (const appId of this.listeners.get(metadata_1.AppInterface.IPostUserCreated)) {
                const app = this.manager.getOneById(appId);
                yield app.call(metadata_1.AppMethod.EXECUTE_POST_USER_CREATED, data);
            }
        });
    }
    executePostUserUpdated(data) {
        return __awaiter(this, void 0, void 0, function* () {
            for (const appId of this.listeners.get(metadata_1.AppInterface.IPostUserUpdated)) {
                const app = this.manager.getOneById(appId);
                yield app.call(metadata_1.AppMethod.EXECUTE_POST_USER_UPDATED, data);
            }
        });
    }
    executePostUserDeleted(data) {
        return __awaiter(this, void 0, void 0, function* () {
            for (const appId of this.listeners.get(metadata_1.AppInterface.IPostUserDeleted)) {
                const app = this.manager.getOneById(appId);
                yield app.call(metadata_1.AppMethod.EXECUTE_POST_USER_DELETED, data);
            }
        });
    }
    executePostUserLoggedIn(data) {
        return __awaiter(this, void 0, void 0, function* () {
            for (const appId of this.listeners.get(metadata_1.AppInterface.IPostUserLoggedIn)) {
                const app = this.manager.getOneById(appId);
                yield app.call(metadata_1.AppMethod.EXECUTE_POST_USER_LOGGED_IN, data);
            }
        });
    }
    executePostUserLoggedOut(data) {
        return __awaiter(this, void 0, void 0, function* () {
            for (const appId of this.listeners.get(metadata_1.AppInterface.IPostUserLoggedOut)) {
                const app = this.manager.getOneById(appId);
                yield app.call(metadata_1.AppMethod.EXECUTE_POST_USER_LOGGED_OUT, data);
            }
        });
    }
    executePostUserStatusChanged(data) {
        return __awaiter(this, void 0, void 0, function* () {
            for (const appId of this.listeners.get(metadata_1.AppInterface.IPostUserStatusChanged)) {
                const app = this.manager.getOneById(appId);
                yield app.call(metadata_1.AppMethod.EXECUTE_POST_USER_STATUS_CHANGED, data);
            }
        });
    }
}
exports.AppListenerManager = AppListenerManager;
//# sourceMappingURL=AppListenerManager.js.map