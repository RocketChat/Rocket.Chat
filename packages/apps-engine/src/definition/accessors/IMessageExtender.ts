import type { IMessage, IMessageAttachment } from '../messages';
import type { RocketChatAssociationModel } from '../metadata';

export interface IMessageExtender {
    kind: RocketChatAssociationModel.MESSAGE;

    /**
     * Adds a custom field to the message.
     * Note: This key can not already exist or it will throw an error.
     * Note: The key must not contain a period in it, an error will be thrown.
     *
     * @param key the name of the custom field
     * @param value the value of this custom field
     */
    addCustomField(key: string, value: any): IMessageExtender;

    /**
     * Adds a single attachment to the message.
     *
     * @param attachment the item to add
     */
    addAttachment(attachment: IMessageAttachment): IMessageExtender;

    /**
     * Adds all of the provided attachments to the message.
     *
     * @param attachments an array of attachments
     */
    addAttachments(attachments: Array<IMessageAttachment>): IMessageExtender;

    /**
     * Gets the resulting message that has been extended at the point of calling it.
     * Note: modifying the returned value will have no effect.
     */
    getMessage(): IMessage;
}
