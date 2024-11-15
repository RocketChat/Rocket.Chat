/**
 * @deprecated please prefer the rocket.chat/ui-kit components
 */
export declare enum TextObjectType {
    MARKDOWN = "mrkdwn",
    PLAINTEXT = "plain_text"
}
/**
 * @deprecated please prefer the rocket.chat/ui-kit components
 */
export interface ITextObject {
    type: TextObjectType;
    text: string;
    emoji?: boolean;
}
/**
 * @deprecated please prefer the rocket.chat/ui-kit components
 */
export interface IOptionObject {
    text: ITextObject;
    value: string;
    url?: string;
}
