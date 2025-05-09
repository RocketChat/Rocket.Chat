import type { LayoutBlock } from '@rocket.chat/ui-kit';

import type { IMessage, IMessageAttachment } from '../messages';
import type { RocketChatAssociationModel } from '../metadata';
import type { IRoom } from '../rooms';
import type { BlockBuilder, IBlock } from '../uikit';
import type { IUser } from '../users';

/**
 * Interface for building out a message.
 * Please note, that a room and sender must be associated otherwise you will NOT
 * be able to successfully save the message object.
 */
export interface IMessageBuilder {
    kind: RocketChatAssociationModel.MESSAGE;

    /**
     * Provides a convenient way to set the data for the message.
     * Note: Providing an "id" field here will be ignored.
     *
     * @param message the message data to set
     */
    setData(message: IMessage): IMessageBuilder;

    /**
     * Provides a convenient way to set the data for the message
     * keeping the "id" field so as to update the message later.
     *
     * @param message the message data to set
     * @param editor the user who edited the updated message
     */
    setUpdateData(message: IMessage, editor: IUser): IMessageBuilder;

    /**
     * Sets the thread to which this message belongs, if any.
     *
     * @param threadId The id of the thread
     */
    setThreadId(threadId: string): IMessageBuilder;

    /**
     * Retrieves the threadId to which this message belongs,
     * if any.
     *
     * If you would like to retrieve the actual message that
     * the thread originated from, you can use the
     * `IMessageRead.getById()` method
     */
    getThreadId(): string;

    /**
     * Sets the room where this message should be sent to.
     *
     * @param room the room where to send
     */
    setRoom(room: IRoom): IMessageBuilder;

    /**
     * Gets the room where this message was sent to.
     */
    getRoom(): IRoom;

    /**
     * Sets the sender of this message.
     *
     * @param sender the user sending the message
     */
    setSender(sender: IUser): IMessageBuilder;

    /**
     * Gets the User which sent the message.
     */
    getSender(): IUser;

    /**
     * Sets the text of the message.
     *
     * @param text the actual text
     */
    setText(text: string): IMessageBuilder;

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
    setEmojiAvatar(emoji: string): IMessageBuilder;

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
    setAvatarUrl(avatarUrl: string): IMessageBuilder;

    /**
     * Gets the url used for the avatar.
     */
    getAvatarUrl(): string;

    /**
     * Sets the display text of the sender's username that is visible.
     *
     * @param alias the username alias to display
     */
    setUsernameAlias(alias: string): IMessageBuilder;

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
    addAttachment(attachment: IMessageAttachment): IMessageBuilder;

    /**
     * Sets the attachments for the message, replacing and destroying all of the current attachments.
     *
     * @param attachments array of the attachments
     */
    setAttachments(attachments: Array<IMessageAttachment>): IMessageBuilder;

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
    replaceAttachment(position: number, attachment: IMessageAttachment): IMessageBuilder;

    /**
     * Removes an attachment at the given position (index).
     * If there is no attachment at that position, there will be an error thrown.
     *
     * @param position the index of the attachment to remove
     */
    removeAttachment(position: number): IMessageBuilder;

    /**
     * Sets the user who is editing this message.
     * This is required if you are modifying an existing message.
     *
     * @param user the editor
     */
    setEditor(user: IUser): IMessageBuilder;

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
    setGroupable(groupable: boolean): IMessageBuilder;

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
    setParseUrls(parseUrls: boolean): IMessageBuilder;

    /**
     * Gets whether this message should have its URLs parsed
     */
    getParseUrls(): boolean;

    /**
     * Gets the resulting message that has been built up to the point of calling it.
     *
     * *Note:* This will error out if the Room has not been defined.
     */
    getMessage(): IMessage;

    /**
     * Adds a block collection to the message's
     * own collection
     */
    addBlocks(blocks: BlockBuilder | Array<IBlock | LayoutBlock>): IMessageBuilder;

    /**
     * Sets the block collection of the message
     *
     * @param blocks
     */
    setBlocks(blocks: BlockBuilder | Array<IBlock | LayoutBlock>): IMessageBuilder;

    /**
     * Gets the block collection of the message
     */
    getBlocks(): Array<IBlock | LayoutBlock>;

    /**
     * Adds a custom field to the message.
     * Note: This key can not already exist or it will throw an error.
     * Note: The key must not contain a period in it, an error will be thrown.
     *
     * @param key the name of the custom field
     * @param value the value of this custom field
     */
    addCustomField(key: string, value: any): IMessageBuilder;
}
