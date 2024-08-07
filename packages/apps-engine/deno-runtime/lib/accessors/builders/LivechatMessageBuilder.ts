import type { RocketChatAssociationModel as _RocketChatAssociationModel } from '@rocket.chat/apps-engine/definition/metadata/RocketChatAssociations.ts';
import type { RoomType as _RoomType } from '@rocket.chat/apps-engine/definition/rooms/RoomType.ts';

import type { ILivechatMessageBuilder } from '@rocket.chat/apps-engine/definition/accessors/ILivechatMessageBuilder.ts';
import type { IMessage } from '@rocket.chat/apps-engine/definition/messages/IMessage.ts';
import type { IMessageAttachment } from '@rocket.chat/apps-engine/definition/messages/IMessageAttachment.ts';
import type { IRoom } from '@rocket.chat/apps-engine/definition/rooms/IRoom.ts';
import type { IUser } from '@rocket.chat/apps-engine/definition/users/IUser.ts';
import type { ILivechatMessage as EngineLivechatMessage } from '@rocket.chat/apps-engine/definition/livechat/ILivechatMessage.ts';
import type { IVisitor } from '@rocket.chat/apps-engine/definition/livechat/IVisitor.ts';
import type { IMessageBuilder } from '@rocket.chat/apps-engine/definition/accessors/IMessageBuilder.ts';

import { MessageBuilder } from './MessageBuilder.ts';
import { require } from '../../../lib/require.ts';

const { RocketChatAssociationModel } = require('@rocket.chat/apps-engine/definition/metadata/RocketChatAssociations.js') as {
    RocketChatAssociationModel: typeof _RocketChatAssociationModel;
};

const { RoomType } = require('@rocket.chat/apps-engine/definition/rooms/RoomType.js') as { RoomType: typeof _RoomType };

export interface ILivechatMessage extends EngineLivechatMessage, IMessage {}

export class LivechatMessageBuilder implements ILivechatMessageBuilder {
    public kind: _RocketChatAssociationModel.LIVECHAT_MESSAGE;

    private msg: ILivechatMessage;

    constructor(message?: ILivechatMessage) {
        this.kind = RocketChatAssociationModel.LIVECHAT_MESSAGE;
        this.msg = message || ({} as ILivechatMessage);
    }

    public setData(data: ILivechatMessage): ILivechatMessageBuilder {
        delete data.id;
        this.msg = data;

        return this;
    }

    public setRoom(room: IRoom): ILivechatMessageBuilder {
        this.msg.room = room;
        return this;
    }

    public getRoom(): IRoom {
        return this.msg.room;
    }

    public setSender(sender: IUser): ILivechatMessageBuilder {
        this.msg.sender = sender;
        delete this.msg.visitor;

        return this;
    }

    public getSender(): IUser {
        return this.msg.sender;
    }

    public setText(text: string): ILivechatMessageBuilder {
        this.msg.text = text;
        return this;
    }

    public getText(): string {
        return this.msg.text!;
    }

    public setEmojiAvatar(emoji: string): ILivechatMessageBuilder {
        this.msg.emoji = emoji;
        return this;
    }

    public getEmojiAvatar(): string {
        return this.msg.emoji!;
    }

    public setAvatarUrl(avatarUrl: string): ILivechatMessageBuilder {
        this.msg.avatarUrl = avatarUrl;
        return this;
    }

    public getAvatarUrl(): string {
        return this.msg.avatarUrl!;
    }

    public setUsernameAlias(alias: string): ILivechatMessageBuilder {
        this.msg.alias = alias;
        return this;
    }

    public getUsernameAlias(): string {
        return this.msg.alias!;
    }

    public addAttachment(attachment: IMessageAttachment): ILivechatMessageBuilder {
        if (!this.msg.attachments) {
            this.msg.attachments = [];
        }

        this.msg.attachments.push(attachment);
        return this;
    }

    public setAttachments(attachments: Array<IMessageAttachment>): ILivechatMessageBuilder {
        this.msg.attachments = attachments;
        return this;
    }

    public getAttachments(): Array<IMessageAttachment> {
        return this.msg.attachments!;
    }

    public replaceAttachment(position: number, attachment: IMessageAttachment): ILivechatMessageBuilder {
        if (!this.msg.attachments) {
            this.msg.attachments = [];
        }

        if (!this.msg.attachments[position]) {
            throw new Error(`No attachment found at the index of "${position}" to replace.`);
        }

        this.msg.attachments[position] = attachment;
        return this;
    }

    public removeAttachment(position: number): ILivechatMessageBuilder {
        if (!this.msg.attachments) {
            this.msg.attachments = [];
        }

        if (!this.msg.attachments[position]) {
            throw new Error(`No attachment found at the index of "${position}" to remove.`);
        }

        this.msg.attachments.splice(position, 1);

        return this;
    }

    public setEditor(user: IUser): ILivechatMessageBuilder {
        this.msg.editor = user;
        return this;
    }

    public getEditor(): IUser {
        return this.msg.editor;
    }

    public setGroupable(groupable: boolean): ILivechatMessageBuilder {
        this.msg.groupable = groupable;
        return this;
    }

    public getGroupable(): boolean {
        return this.msg.groupable!;
    }

    public setParseUrls(parseUrls: boolean): ILivechatMessageBuilder {
        this.msg.parseUrls = parseUrls;
        return this;
    }

    public getParseUrls(): boolean {
        return this.msg.parseUrls!;
    }

    public setToken(token: string): ILivechatMessageBuilder {
        this.msg.token = token;
        return this;
    }

    public getToken(): string {
        return this.msg.token!;
    }

    public setVisitor(visitor: IVisitor): ILivechatMessageBuilder {
        this.msg.visitor = visitor;
        delete this.msg.sender;

        return this;
    }

    public getVisitor(): IVisitor {
        return this.msg.visitor;
    }

    public getMessage(): ILivechatMessage {
        if (!this.msg.room) {
            throw new Error('The "room" property is required.');
        }

        if (this.msg.room.type !== RoomType.LIVE_CHAT) {
            throw new Error('The room is not a Livechat room');
        }

        return this.msg;
    }

    public getMessageBuilder(): IMessageBuilder {
        return new MessageBuilder(this.msg as IMessage);
    }
}
