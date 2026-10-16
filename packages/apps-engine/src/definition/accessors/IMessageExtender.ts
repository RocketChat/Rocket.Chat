import type { IMessage, IMessageAttachment } from '../messages';
import type { RocketChatAssociationModel } from '../metadata';

/**
 * Adds attachments and custom fields to a message, leaving everything already
 * on it alone.
 *
 * Get one from `IModifyExtender.extendMessage` and hand it back to
 * `IModifyExtender.finish` to apply the additions.
 */
export interface IMessageExtender {
	kind: RocketChatAssociationModel.MESSAGE;

	/**
	 * Adds a custom field to the message.
	 *
	 * > [!WARNING]
	 * > The key has to be new, and it must not contain a period. Either one
	 * > throws an error.
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
	 *
	 * > [!NOTE]
	 * > Modifying the returned value will have no effect.
	 */
	getMessage(): IMessage;
}
