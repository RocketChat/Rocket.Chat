/**
 * The field property of the attachments allows for "tables" or "columns" to be displayed on messages.
 */
export interface IMessageAttachmentField {
    /** Whether this field should be a short field. */
    short?: boolean;
    /** The title of this field. */
    title: string;
    /** The value of this field, displayed underneath the title value. */
    value: string;
}
