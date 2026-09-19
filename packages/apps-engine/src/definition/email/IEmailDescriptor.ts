/**
 * An email on its way out of the workspace, as an `IPreEmailSent` handler sees
 * it.
 *
 * Every field is optional because the handler returns the whole descriptor
 * back: return the one it was given to leave the email alone, or a changed
 * copy to rewrite it.
 */
export interface IEmailDescriptor {
	/** Who the email comes from. */
	from?: string | undefined;
	/** Who receives the email. */
	to?: string | Array<string> | undefined;
	/** Who receives a copy. */
	cc?: string | Array<string> | undefined;
	/** Who receives a copy without the other recipients seeing it. */
	bcc?: string | Array<string> | undefined;
	/** Where replies should go, when that is not the sender. */
	replyTo?: string | Array<string> | undefined;
	/** The email's subject line. */
	subject?: string | undefined;
	/** The email's plain text body, for clients that do not render HTML. */
	text?: string | undefined;
	/** The email's HTML body. */
	html?: string | undefined;
	/** Extra headers to put on the message. */
	headers?: Record<string, string> | undefined;
}
