"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MessageBuilder = void 0;
const metadata_1 = require("../../definition/metadata");
const uikit_1 = require("../../definition/uikit");
class MessageBuilder {
    constructor(message) {
        this.kind = metadata_1.RocketChatAssociationModel.MESSAGE;
        this.msg = message || {};
    }
    setData(data) {
        delete data.id;
        this.msg = data;
        return this;
    }
    setUpdateData(data, editor) {
        this.msg = data;
        this.msg.editor = editor;
        this.msg.editedAt = new Date();
        return this;
    }
    setThreadId(threadId) {
        this.msg.threadId = threadId;
        return this;
    }
    getThreadId() {
        return this.msg.threadId;
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
    getMessage() {
        if (!this.msg.room) {
            throw new Error('The "room" property is required.');
        }
        return this.msg;
    }
    addBlocks(blocks) {
        if (!Array.isArray(this.msg.blocks)) {
            this.msg.blocks = [];
        }
        if (blocks instanceof uikit_1.BlockBuilder) {
            this.msg.blocks.push(...blocks.getBlocks());
        }
        else {
            this.msg.blocks.push(...blocks);
        }
        return this;
    }
    setBlocks(blocks) {
        if (blocks instanceof uikit_1.BlockBuilder) {
            this.msg.blocks = blocks.getBlocks();
        }
        else {
            this.msg.blocks = blocks;
        }
        return this;
    }
    getBlocks() {
        return this.msg.blocks;
    }
    addCustomField(key, value) {
        if (!this.msg.customFields) {
            this.msg.customFields = {};
        }
        if (this.msg.customFields[key]) {
            throw new Error(`The message already contains a custom field by the key: ${key}`);
        }
        if (key.includes('.')) {
            throw new Error(`The given key contains a period, which is not allowed. Key: ${key}`);
        }
        this.msg.customFields[key] = value;
        return this;
    }
}
exports.MessageBuilder = MessageBuilder;
//# sourceMappingURL=MessageBuilder.js.map