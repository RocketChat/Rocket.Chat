import type { IMessageAction } from './IMessageAction';
import type { IMessageAttachmentAuthor } from './IMessageAttachmentAuthor';
import type { IMessageAttachmentField } from './IMessageAttachmentField';
import type { IMessageAttachmentTitle } from './IMessageAttachmentTitle';
import type { MessageActionButtonsAlignment } from './MessageActionButtonsAlignment';

/**
 * Interface which represents an attachment which can be added to a message.
 */
export interface IMessageAttachment {
    /** Causes the image, audio, and video sections to be hidding when this is true. */
    collapsed?: boolean;
    /** The color you want the order on the left side to be, supports any valid background-css value. */
    color?: string; // TODO: Maybe we change this to a Color class which has helper methods?
    /** The text to display for this attachment. */
    text?: string;
    /** Displays the time next to the text portion. */
    timestamp?: Date;
    /** Only applicable if the timestamp is provided, as it makes the time clickable to this link. */
    timestampLink?: string;
    /** An image that displays to the left of the text, looks better when this is relatively small. */
    thumbnailUrl?: string;
    /** Author portion of the attachment. */
    author?: IMessageAttachmentAuthor;
    /** Title portion of the attachment. */
    title?: IMessageAttachmentTitle;
    /** The image to display, will be "big" and easy to see. */
    imageUrl?: string;
    /** Audio file to play, only supports what html's <audio> does. */
    audioUrl?: string;
    /** Video file to play, only supports what html's <video> does. */
    videoUrl?: string;
    /** The type of attachment this is, although hardly used and only used for `file`s. */
    type?: string;
    /** Allows users to describe what the attachment is. */
    description?: string;
    /** States how the action buttons are aligned. */
    actionButtonsAlignment?: MessageActionButtonsAlignment;
    /** Allows displaying action items, such as buttons, on the attachment. */
    actions?: Array<IMessageAction>;
    /** The field property of the attachments allows for "tables" or "columns" to be displayed on messages. */
    fields?: Array<IMessageAttachmentField>;
}
