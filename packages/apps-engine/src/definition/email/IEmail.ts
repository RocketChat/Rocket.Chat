export interface IEmail {
    to: string | string[];
    from: string;
    replyTo?: string;
    subject: string;
    html?: string;
    text?: string;
    headers?: string;
}
