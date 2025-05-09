export interface IEmailDescriptor {
    from?: string | undefined;
    to?: string | Array<string> | undefined;
    cc?: string | Array<string> | undefined;
    bcc?: string | Array<string> | undefined;
    replyTo?: string | Array<string> | undefined;
    subject?: string | undefined;
    text?: string | undefined;
    html?: string | undefined;
    headers?: Record<string, string> | undefined;
}
