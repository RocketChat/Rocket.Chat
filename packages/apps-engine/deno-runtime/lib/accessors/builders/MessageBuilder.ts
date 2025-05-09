import { LayoutBlock } from '@rocket.chat/ui-kit';

import type { IMessageBuilder } from '@rocket.chat/apps-engine/definition/accessors/IMessageBuilder.ts';
import type { RocketChatAssociationModel as _RocketChatAssociationModel } from '@rocket.chat/apps-engine/definition/metadata/RocketChatAssociations.ts';
import type { IMessage } from '@rocket.chat/apps-engine/definition/messages/IMessage.ts';
import type { IMessageAttachment } from '@rocket.chat/apps-engine/definition/messages/IMessageAttachment.ts';
import type { IUser } from '@rocket.chat/apps-engine/definition/users/IUser.ts';
import type { IRoom } from '@rocket.chat/apps-engine/definition/rooms/IRoom.ts';
import type { IBlock } from '@rocket.chat/apps-engine/definition/uikit/blocks/Blocks.ts';

import { BlockBuilder } from './BlockBuilder.ts';
import { require } from '../../../lib/require.ts';

const { RocketChatAssociationModel } = require('@rocket.chat/apps-engine/definition/metadata/RocketChatAssociations.js') as {
    RocketChatAssociationModel: typeof _RocketChatAssociationModel;
};

export class MessageBuilder implements IMessageBuilder {
    public kind: _RocketChatAssociationModel.MESSAGE;

    private msg: IMessage;

    private changes: Partial<IMessage> = {};
    private attachmentsChanged = false;
    private customFieldsChanged = false;

    constructor(message?: IMessage) {
        this.kind = RocketChatAssociationModel.MESSAGE;
        this.msg = message || ({} as IMessage);
    }

    public setData(data: IMessage): IMessageBuilder {
        delete data.id;
        this.msg = data;

        return this as IMessageBuilder;
    }

    public setUpdateData(data: IMessage, editor: IUser): IMessageBuilder {
        this.msg = data;
        this.msg.editor = editor;
        this.msg.editedAt = new Date();

        this.changes = structuredClone(this.msg);

        return this as IMessageBuilder;
    }

    public setThreadId(threadId: string): IMessageBuilder {
        this.msg.threadId = threadId;
        this.changes.threadId = threadId;

        return this as IMessageBuilder;
    }

    public getThreadId(): string {
        return this.msg.threadId!;
    }

    public setRoom(room: IRoom): IMessageBuilder {
        this.msg.room = room;
        this.changes.room = room;

        return this as IMessageBuilder;
    }

    public getRoom(): IRoom {
        return this.msg.room;
    }

    public setSender(sender: IUser): IMessageBuilder {
        this.msg.sender = sender;
        this.changes.sender = sender;

        return this as IMessageBuilder;
    }

    public getSender(): IUser {
        return this.msg.sender;
    }

    public setText(text: string): IMessageBuilder {
        this.msg.text = text;
        this.changes.text = text;

        return this as IMessageBuilder;
    }

    public getText(): string {
        return this.msg.text!;
    }

    public setEmojiAvatar(emoji: string): IMessageBuilder {
        this.msg.emoji = emoji;
        this.changes.emoji = emoji;

        return this as IMessageBuilder;
    }

    public getEmojiAvatar(): string {
        return this.msg.emoji!;
    }

    public setAvatarUrl(avatarUrl: string): IMessageBuilder {
        this.msg.avatarUrl = avatarUrl;
        this.changes.avatarUrl = avatarUrl;

        return this as IMessageBuilder;
    }

    public getAvatarUrl(): string {
        return this.msg.avatarUrl!;
    }

    public setUsernameAlias(alias: string): IMessageBuilder {
        this.msg.alias = alias;
        this.changes.alias = alias;

        return this as IMessageBuilder;
    }

    public getUsernameAlias(): string {
        return this.msg.alias!;
    }

    public addAttachment(attachment: IMessageAttachment): IMessageBuilder {
        if (!this.msg.attachments) {
            this.msg.attachments = [];
        }

        this.msg.attachments.push(attachment);
        this.attachmentsChanged = true;

        return this as IMessageBuilder;
    }

    public setAttachments(attachments: Array<IMessageAttachment>): IMessageBuilder {
        this.msg.attachments = attachments;
        this.attachmentsChanged = true;

        return this as IMessageBuilder;
    }

    public getAttachments(): Array<IMessageAttachment> {
        return this.msg.attachments!;
    }

    public replaceAttachment(position: number, attachment: IMessageAttachment): IMessageBuilder {
        if (!this.msg.attachments?.[position]) {
            throw new Error(`No attachment found at the index of "${position}" to replace.`);
        }

        this.msg.attachments[position] = attachment;
        this.attachmentsChanged = true;

        return this as IMessageBuilder;
    }

    public removeAttachment(position: number): IMessageBuilder {
        if (!this.msg.attachments?.[position]) {
            throw new Error(`No attachment found at the index of "${position}" to remove.`);
        }

        this.msg.attachments.splice(position, 1);
        this.attachmentsChanged = true;

        return this as IMessageBuilder;
    }

    public setEditor(user: IUser): IMessageBuilder {
        this.msg.editor = user;
        this.changes.editor = user;

        return this as IMessageBuilder;
    }

    public getEditor(): IUser {
        return this.msg.editor;
    }

    public setGroupable(groupable: boolean): IMessageBuilder {
        this.msg.groupable = groupable;
        this.changes.groupable = groupable;

        return this as IMessageBuilder;
    }

    public getGroupable(): boolean {
        return this.msg.groupable!;
    }

    public setParseUrls(parseUrls: boolean): IMessageBuilder {
        this.msg.parseUrls = parseUrls;
        this.changes.parseUrls = parseUrls;

        return this as IMessageBuilder;
    }

    public getParseUrls(): boolean {
        return this.msg.parseUrls!;
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

        return this as IMessageBuilder;
    }

    public setBlocks(blocks: BlockBuilder | Array<IBlock | LayoutBlock>) {
        const blockArray: Array<IBlock | LayoutBlock> = blocks instanceof BlockBuilder ? blocks.getBlocks() : blocks;

        this.msg.blocks = blockArray;
        this.changes.blocks = blockArray;

        return this as IMessageBuilder;
    }

    public getBlocks() {
        return this.msg.blocks!;
    }

    public addCustomField(key: string, value: unknown): IMessageBuilder {
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

        this.customFieldsChanged = true;

        return this as IMessageBuilder;
    }

    public getChanges(): Partial<IMessage> {
        const changes: typeof this.changes = structuredClone(this.changes);

        if (this.attachmentsChanged) {
            changes.attachments = structuredClone(this.msg.attachments);
        }

        if (this.customFieldsChanged) {
            changes.customFields = structuredClone(this.msg.customFields);
        }

        return changes;
    }
}
