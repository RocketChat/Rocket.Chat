export interface IMessageAttachmentTitle {
    /** Title to display for this attachment, displays under the author. */
    value?: string;
    /** Providing this makes the title clickable, pointing to this link. */
    link?: string;
    /** When this is provided, a download icon appears and clicking this prompts a download. */
    displayDownloadLink?: boolean;
}
