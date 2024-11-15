"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LivechatMessageBuilder = void 0;
const MessageBuilder_1 = require("./MessageBuilder");
const metadata_1 = require("../../definition/metadata");
const rooms_1 = require("../../definition/rooms");
class LivechatMessageBuilder {
    constructor(message) {
        this.kind = metadata_1.RocketChatAssociationModel.LIVECHAT_MESSAGE;
        this.msg = message || {};
    }
    setData(data) {
        delete data.id;
        this.msg = data;
        return this;
    }
    setRoom(room) {
        this.msg.room = room;
        return this;
    }
    getRoom() {
        return this.msg.room;
    }
    setSender(sender) {
        this.msg.sender = sender;
        delete this.msg.visitor;
        return this;
    }
    getSender() {
        return this.msg.sender;
    }
    setText(text) {
        this.msg.text = text;
        return this;
    }
    getText() {
        return this.msg.text;
    }
    setEmojiAvatar(emoji) {
        this.msg.emoji = emoji;
        return this;
    }
    getEmojiAvatar() {
        return this.msg.emoji;
    }
    setAvatarUrl(avatarUrl) {
        this.msg.avatarUrl = avatarUrl;
        return this;
    }
    getAvatarUrl() {
        return this.msg.avatarUrl;
    }
    setUsernameAlias(alias) {
        this.msg.alias = alias;
        return this;
    }
    getUsernameAlias() {
        return this.msg.alias;
    }
    addAttachment(attachment) {
        if (!this.msg.attachments) {
            this.msg.attachments = [];
        }
        this.msg.attachments.push(attachment);
        return this;
    }
    setAttachments(attachments) {
        this.msg.attachments = attachments;
        return this;
    }
    getAttachments() {
        return this.msg.attachments;
    }
    replaceAttachment(position, attachment) {
        if (!this.msg.attachments) {
            this.msg.attachments = [];
        }
        if (!this.msg.attachments[position]) {
            throw new Error(`No attachment found at the index of "${position}" to replace.`);
        }
        this.msg.attachments[position] = attachment;
        return this;
    }
    removeAttachment(position) {
        if (!this.msg.attachments) {
            this.msg.attachments = [];
        }
        if (!this.msg.attachments[position]) {
            throw new Error(`No attachment found at the index of "${position}" to remove.`);
        }
        this.msg.attachments.splice(position, 1);
        return this;
    }
    setEditor(user) {
        this.msg.editor = user;
        return this;
    }
    getEditor() {
        return this.msg.editor;
    }
    setGroupable(groupable) {
        this.msg.groupable = groupable;
        return this;
    }
    getGroupable() {
        return this.msg.groupable;
    }
    setParseUrls(parseUrls) {
        this.msg.parseUrls = parseUrls;
        return this;
    }
    getParseUrls() {
        return this.msg.parseUrls;
    }
    setToken(token) {
        this.msg.token = token;
        return this;
    }
    getToken() {
        return this.msg.token;
    }
    setVisitor(visitor) {
        this.msg.visitor = visitor;
        delete this.msg.sender;
        return this;
    }
    getVisitor() {
        return this.msg.visitor;
    }
    getMessage() {
        if (!this.msg.room) {
            throw new Error('The "room" property is required.');
        }
        if (this.msg.room.type !== rooms_1.RoomType.LIVE_CHAT) {
            throw new Error('The room is not a Livechat room');
        }
        return this.msg;
    }
    getMessageBuilder() {
        return new MessageBuilder_1.MessageBuilder(this.msg);
    }
}
exports.LivechatMessageBuilder = LivechatMessageBuilder;
//# sourceMappingURL=LivechatMessageBuilder.js.map