/**
 * Interface for the author piece of the attachments.
 */
export interface IMessageAttachmentAuthor {
    /** The name of the author. */
    name?: string;
    /** Providing this makes the author name clickable and points to this link. */
    link?: string;
    /** Displays a tiny icon to the left of the Author’s name. */
    icon?: string;
}
