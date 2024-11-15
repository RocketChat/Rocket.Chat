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
exports.ModifyCreator = void 0;
const DiscussionBuilder_1 = require("./DiscussionBuilder");
const EmailCreator_1 = require("./EmailCreator");
const LivechatCreator_1 = require("./LivechatCreator");
const LivechatMessageBuilder_1 = require("./LivechatMessageBuilder");
const MessageBuilder_1 = require("./MessageBuilder");
const RoomBuilder_1 = require("./RoomBuilder");
const UploadCreator_1 = require("./UploadCreator");
const UserBuilder_1 = require("./UserBuilder");
const VideoConferenceBuilder_1 = require("./VideoConferenceBuilder");
const metadata_1 = require("../../definition/metadata");
const rooms_1 = require("../../definition/rooms");
const uikit_1 = require("../../definition/uikit");
const UserType_1 = require("../../definition/users/UserType");
const UIHelper_1 = require("../misc/UIHelper");
class ModifyCreator {
    constructor(bridges, appId) {
        this.bridges = bridges;
        this.appId = appId;
        this.livechatCreator = new LivechatCreator_1.LivechatCreator(bridges, appId);
        this.uploadCreator = new UploadCreator_1.UploadCreator(bridges, appId);
        this.emailCreator = new EmailCreator_1.EmailCreator(bridges, appId);
    }
    getLivechatCreator() {
        return this.livechatCreator;
    }
    getUploadCreator() {
        return this.uploadCreator;
    }
    getEmailCreator() {
        return this.emailCreator;
    }
    /**
     * @deprecated please prefer the rocket.chat/ui-kit components
     */
    getBlockBuilder() {
        return new uikit_1.BlockBuilder(this.appId);
    }
    startMessage(data) {
        if (data) {
            delete data.id;
        }
        return new MessageBuilder_1.MessageBuilder(data);
    }
    startLivechatMessage(data) {
        if (data) {
            delete data.id;
        }
        return new LivechatMessageBuilder_1.LivechatMessageBuilder(data);
    }
    startRoom(data) {
        if (data) {
            delete data.id;
        }
        return new RoomBuilder_1.RoomBuilder(data);
    }
    startDiscussion(data) {
        if (data) {
            delete data.id;
        }
        return new DiscussionBuilder_1.DiscussionBuilder(data);
    }
    startVideoConference(data) {
        return new VideoConferenceBuilder_1.VideoConferenceBuilder(data);
    }
    startBotUser(data) {
        if (data) {
            delete data.id;
            const { roles } = data;
            if (roles && roles.length) {
                const hasRole = roles.map((role) => role.toLocaleLowerCase()).some((role) => role === 'admin' || role === 'owner' || role === 'moderator');
                if (hasRole) {
                    throw new Error('Invalid role assigned to the user. Should not be admin, owner or moderator.');
                }
            }
            if (!data.type) {
                data.type = UserType_1.UserType.BOT;
            }
        }
        return new UserBuilder_1.UserBuilder(data);
    }
    finish(builder) {
        switch (builder.kind) {
            case metadata_1.RocketChatAssociationModel.MESSAGE:
                return this._finishMessage(builder);
            case metadata_1.RocketChatAssociationModel.LIVECHAT_MESSAGE:
                return this._finishLivechatMessage(builder);
            case metadata_1.RocketChatAssociationModel.ROOM:
                return this._finishRoom(builder);
            case metadata_1.RocketChatAssociationModel.DISCUSSION:
                return this._finishDiscussion(builder);
            case metadata_1.RocketChatAssociationModel.VIDEO_CONFERENCE:
                return this._finishVideoConference(builder);
            case metadata_1.RocketChatAssociationModel.USER:
                return this._finishUser(builder);
            default:
                throw new Error('Invalid builder passed to the ModifyCreator.finish function.');
        }
    }
    _finishMessage(builder) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            const result = builder.getMessage();
            delete result.id;
            if (!result.sender || !result.sender.id) {
                const appUser = yield this.bridges.getUserBridge().doGetAppUser(this.appId);
                if (!appUser) {
                    throw new Error('Invalid sender assigned to the message.');
                }
                result.sender = appUser;
            }
            if ((_a = result.blocks) === null || _a === void 0 ? void 0 : _a.length) {
                result.blocks = UIHelper_1.UIHelper.assignIds(result.blocks, this.appId);
            }
            return this.bridges.getMessageBridge().doCreate(result, this.appId);
        });
    }
    _finishLivechatMessage(builder) {
        if (builder.getSender() && !builder.getVisitor()) {
            return this._finishMessage(builder.getMessageBuilder());
        }
        const result = builder.getMessage();
        delete result.id;
        if (!result.token && (!result.visitor || !result.visitor.token)) {
            throw new Error('Invalid visitor sending the message');
        }
        result.token = result.visitor ? result.visitor.token : result.token;
        return this.bridges.getLivechatBridge().doCreateMessage(result, this.appId);
    }
    _finishRoom(builder) {
        const result = builder.getRoom();
        delete result.id;
        if (!result.type) {
            throw new Error('Invalid type assigned to the room.');
        }
        if (result.type !== rooms_1.RoomType.LIVE_CHAT) {
            if (!result.creator || !result.creator.id) {
                throw new Error('Invalid creator assigned to the room.');
            }
        }
        if (result.type !== rooms_1.RoomType.DIRECT_MESSAGE) {
            if (result.type !== rooms_1.RoomType.LIVE_CHAT) {
                if (!result.slugifiedName || !result.slugifiedName.trim()) {
                    throw new Error('Invalid slugifiedName assigned to the room.');
                }
            }
            if (!result.displayName || !result.displayName.trim()) {
                throw new Error('Invalid displayName assigned to the room.');
            }
        }
        return this.bridges.getRoomBridge().doCreate(result, builder.getMembersToBeAddedUsernames(), this.appId);
    }
    _finishDiscussion(builder) {
        const room = builder.getRoom();
        delete room.id;
        if (!room.creator || !room.creator.id) {
            throw new Error('Invalid creator assigned to the discussion.');
        }
        if (!room.slugifiedName || !room.slugifiedName.trim()) {
            throw new Error('Invalid slugifiedName assigned to the discussion.');
        }
        if (!room.displayName || !room.displayName.trim()) {
            throw new Error('Invalid displayName assigned to the discussion.');
        }
        if (!room.parentRoom || !room.parentRoom.id) {
            throw new Error('Invalid parentRoom assigned to the discussion.');
        }
        return this.bridges
            .getRoomBridge()
            .doCreateDiscussion(room, builder.getParentMessage(), builder.getReply(), builder.getMembersToBeAddedUsernames(), this.appId);
    }
    _finishVideoConference(builder) {
        var _a;
        const videoConference = builder.getVideoConference();
        if (!videoConference.createdBy) {
            throw new Error('Invalid creator assigned to the video conference.');
        }
        if (!((_a = videoConference.providerName) === null || _a === void 0 ? void 0 : _a.trim())) {
            throw new Error('Invalid provider name assigned to the video conference.');
        }
        if (!videoConference.rid) {
            throw new Error('Invalid roomId assigned to the video conference.');
        }
        return this.bridges.getVideoConferenceBridge().doCreate(videoConference, this.appId);
    }
    _finishUser(builder) {
        const user = builder.getUser();
        return this.bridges.getUserBridge().doCreate(user, this.appId);
    }
}
exports.ModifyCreator = ModifyCreator;
//# sourceMappingURL=ModifyCreator.js.map