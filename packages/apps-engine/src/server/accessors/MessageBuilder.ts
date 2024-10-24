import type { LayoutBlock } from '@rocket.chat/ui-kit';

import type { IMessageBuilder } from '../../definition/accessors';
import type { IMessage, IMessageAttachment } from '../../definition/messages';
import { RocketChatAssociationModel } from '../../definition/metadata';
import type { IRoom } from '../../definition/rooms';
import type { IBlock } from '../../definition/uikit';
import { BlockBuilder } from '../../definition/uikit';
import type { IUser } from '../../definition/users';

export class MessageBuilder implements IMessageBuilder {
    public kind: RocketChatAssociationModel.MESSAGE;

    private msg: IMessage;

    constructor(message?: IMessage) {
        this.kind = RocketChatAssociationModel.MESSAGE;
        this.msg = message || ({} as IMessage);
    }

    public setData(data: IMessage): IMessageBuilder {
        delete data.id;
        this.msg = data;

        return this;
    }

    public setUpdateData(data: IMessage, editor: IUser): IMessageBuilder {
        this.msg = data;
        this.msg.editor = editor;
        this.msg.editedAt = new Date();

        return this;
    }

    public setThreadId(threadId: string): IMessageBuilder {
        this.msg.threadId = threadId;

        return this;
    }

    public getThreadId(): string {
        return this.msg.threadId;
    }

    public setRoom(room: IRoom): IMessageBuilder {
        this.msg.room = room;
        return this;
    }

    public getRoom(): IRoom {
        return this.msg.room;
    }

    public setSender(sender: IUser): IMessageBuilder {
        this.msg.sender = sender;
        return this;
    }

    public getSender(): IUser {
        return this.msg.sender;
    }

    public setText(text: string): IMessageBuilder {
        this.msg.text = text;
        return this;
    }

    public getText(): string {
        return this.msg.text;
    }

    public setEmojiAvatar(emoji: string): IMessageBuilder {
        this.msg.emoji = emoji;
        return this;
    }

    public getEmojiAvatar(): string {
        return this.msg.emoji;
    }

    public setAvatarUrl(avatarUrl: string): IMessageBuilder {
        this.msg.avatarUrl = avatarUrl;
        return this;
    }

    public getAvatarUrl(): string {
        return this.msg.avatarUrl;
    }

    public setUsernameAlias(alias: string): IMessageBuilder {
        this.msg.alias = alias;
        return this;
    }

    public getUsernameAlias(): string {
        return this.msg.alias;
    }

    public addAttachment(attachment: IMessageAttachment): IMessageBuilder {
        if (!this.msg.attachments) {
            this.msg.attachments = [];
        }

        this.msg.attachments.push(attachment);
        return this;
    }

    public setAttachments(attachments: Array<IMessageAttachment>): IMessageBuilder {
        this.msg.attachments = attachments;
        return this;
    }

    public getAttachments(): Array<IMessageAttachment> {
        return this.msg.attachments;
    }

    public replaceAttachment(position: number, attachment: IMessageAttachment): IMessageBuilder {
        if (!this.msg.attachments) {
            this.msg.attachments = [];
        }

        if (!this.msg.attachments[position]) {
            throw new Error(`No attachment found at the index of "${position}" to replace.`);
        }

        this.msg.attachments[position] = attachment;
        return this;
    }

    public removeAttachment(position: number): IMessageBuilder {
        if (!this.msg.attachments) {
            this.msg.attachments = [];
        }

        if (!this.msg.attachments[position]) {
            throw new Error(`No attachment found at the index of "${position}" to remove.`);
        }

        this.msg.attachments.splice(position, 1);

        return this;
    }

    public setEditor(user: IUser): IMessageBuilder {
        this.msg.editor = user;
        return this;
    }

    public getEditor(): IUser {
        return this.msg.editor;
    }

    public setGroupable(groupable: boolean): IMessageBuilder {
        this.msg.groupable = groupable;
        return this;
    }

    public getGroupable(): boolean {
        return this.msg.groupable;
    }

    public setParseUrls(parseUrls: boolean): IMessageBuilder {
        this.msg.parseUrls = parseUrls;
        return this;
    }

    public getParseUrls(): boolean {
        return this.msg.parseUrls;
    }

    public getMessage(): IMessage {
        if (!this.msg.room) {
            throw new Error('The "room" property is required.');
        }

        return this.msg;
    }

    public addBlocks(blocks: BlockBuilder | Array<IBlock | LayoutBlock>) {
        if (!Array.isArray(this.msg.blocks)) {
            this.msg.blocks = [];
        }

        if (blocks instanceof BlockBuilder) {
            this.msg.blocks.push(...blocks.getBlocks());
        } else {
            this.msg.blocks.push(...blocks);
        }

        return this;
    }

    public setBlocks(blocks: BlockBuilder | Array<IBlock | LayoutBlock>) {
        if (blocks instanceof BlockBuilder) {
            this.msg.blocks = blocks.getBlocks();
        } else {
            this.msg.blocks = blocks;
        }

        return this;
    }

    public getBlocks() {
        return this.msg.blocks;
    }

    public addCustomField(key: string, value: any): IMessageBuilder {
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
