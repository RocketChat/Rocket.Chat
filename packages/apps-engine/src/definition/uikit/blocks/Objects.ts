/**
 * @deprecated please prefer the rocket.chat/ui-kit components
 */
export enum TextObjectType {
    MARKDOWN = 'mrkdwn',
    PLAINTEXT = 'plain_text',
}

/**
 * @deprecated please prefer the rocket.chat/ui-kit components
 */
export interface ITextObject {
    type: TextObjectType;
    text: string;
    emoji?: boolean;
}

// export interface IConfirmationDialogObject {
//     title: ITextObject;
//     text: ITextObject;
//     confirm: ITextObject;
//     deny: ITextObject;
// }

/**
 * @deprecated please prefer the rocket.chat/ui-kit components
 */
export interface IOptionObject {
    text: ITextObject;
    value: string;

    url?: string;
}
