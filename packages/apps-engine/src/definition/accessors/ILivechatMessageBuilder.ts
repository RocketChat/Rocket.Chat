import type { ILivechatMessage, IVisitor } from '../livechat';
import type { IMessageAttachment } from '../messages';
import type { RocketChatAssociationModel } from '../metadata';
import type { IRoom } from '../rooms';
import type { IUser } from '../users';
import type { IMessageBuilder } from './IMessageBuilder';

/**
 * Interface for building out a livechat message.
 * Please note, that a room and sender must be associated otherwise you will NOT
 * be able to successfully save the message object.
 */
export interface ILivechatMessageBuilder {
    kind: RocketChatAssociationModel.LIVECHAT_MESSAGE;

    /**
     * Provides a convient way to set the data for the message.
     * Note: Providing an "id" field here will be ignored.
     *
     * @param message the message data to set
     */
    setData(message: ILivechatMessage): ILivechatMessageBuilder;

    /**
     * Sets the room where this message should be sent to.
     *
     * @param room the room where to send
     */
    setRoom(room: IRoom): ILivechatMessageBuilder;

    /**
     * Gets the room where this message was sent to.
     */
    getRoom(): IRoom;

    /**
     * Sets the sender of this message.
     *
     * @param sender the user sending the message
     */
    setSender(sender: IUser): ILivechatMessageBuilder;

    /**
     * Gets the User which sent the message.
     */
    getSender(): IUser;

    /**
     * Sets the text of the message.
     *
     * @param text the actual text
     */
    setText(text: string): ILivechatMessageBuilder;

    /**
     * Gets the message text.
     */
    getText(): string;

    /**
     * Sets the emoji to use for the avatar, this overwrites the current avatar
     * whether it be the user's or the avatar url provided.
     *
     * @param emoji the emoji code
     */
    setEmojiAvatar(emoji: string): ILivechatMessageBuilder;

    /**
     * Gets the emoji used for the avatar.
     */
    getEmojiAvatar(): string;

    /**
     * Sets the url which to display for the avatar, this overwrites the current
     * avatar whether it be the user's or an emoji one.
     *
     * @param avatarUrl image url to use as the avatar
     */
    setAvatarUrl(avatarUrl: string): ILivechatMessageBuilder;

    /**
     * Gets the url used for the avatar.
     */
    getAvatarUrl(): string;

    /**
     * Sets the display text of the sender's username that is visible.
     *
     * @param alias the username alias to display
     */
    setUsernameAlias(alias: string): ILivechatMessageBuilder;

    /**
     * Gets the display text of the sender's username that is visible.
     */
    getUsernameAlias(): string;

    /**
     * Adds one attachment to the message's list of attachments, this will not
     * overwrite any existing ones but just adds.
     *
     * @param attachment the attachment to add
     */
    addAttachment(attachment: IMessageAttachment): ILivechatMessageBuilder;

    /**
     * Sets the attachments for the message, replacing and destroying all of the current attachments.
     *
     * @param attachments array of the attachments
     */
    setAttachments(attachments: Array<IMessageAttachment>): ILivechatMessageBuilder;

    /**
     * Gets the attachments array for the message
     */
    getAttachments(): Array<IMessageAttachment>;

    /**
     * Replaces an attachment at the given position (index).
     * If there is no attachment at that position, there will be an error thrown.
     *
     * @param position the index of the attachment to replace
     * @param attachment the attachment to replace with
     */
    replaceAttachment(position: number, attachment: IMessageAttachment): ILivechatMessageBuilder;

    /**
     * Removes an attachment at the given position (index).
     * If there is no attachment at that position, there will be an error thrown.
     *
     * @param position the index of the attachment to remove
     */
    removeAttachment(position: number): ILivechatMessageBuilder;

    /**
     * Sets the user who is editing this message.
     * This is required if you are modifying an existing message.
     *
     * @param user the editor
     */
    setEditor(user: IUser): ILivechatMessageBuilder;

    /**
     * Gets the user who edited the message
     */
    getEditor(): IUser;

    /**
     * Sets whether this message can group with others.
     * This is desirable if you want to avoid confusion with other integrations.
     *
     * @param groupable whether this message can group with others
     */
    setGroupable(groupable: boolean): ILivechatMessageBuilder;

    /**
     * Gets whether this message can group with others.
     */
    getGroupable(): boolean;

    /**
     * Sets whether this message should have any URLs in the text
     * parsed by Rocket.Chat and get the details added to the message's
     * attachments.
     *
     * @param parseUrls whether URLs should be parsed in this message
     */
    setParseUrls(parseUrls: boolean): ILivechatMessageBuilder;

    /**
     * Gets whether this message should have its URLs parsed
     */
    getParseUrls(): boolean;

    /**
     * Set the token of the livechat visitor that
     * sent the message
     *
     * @param token The Livechat visitor's token
     */
    setToken(token: string): ILivechatMessageBuilder;

    /**
     * Gets the token of the livechat visitor that
     * sent the message
     */
    getToken(): string;

    /**
     * If the sender of the message is a Livechat Visitor,
     * set the visitor who sent the message.
     *
     * If you set the visitor property of a message, the
     * sender will be emptied
     *
     * @param visitor The visitor who sent the message
     */
    setVisitor(visitor: IVisitor): ILivechatMessageBuilder;

    /**
     * Get the visitor who sent the message,
     * if any
     */
    getVisitor(): IVisitor;

    /**
     * Gets the resulting message that has been built up to the point of calling it.
     *
     * *Note:* This will error out if the Room has not been defined OR if the room
     * is not of type RoomType.LIVE_CHAT.
     */
    getMessage(): ILivechatMessage;

    /**
     * Returns a message builder based on the
     * livechat message of this builder
     */
    getMessageBuilder(): IMessageBuilder;
}
