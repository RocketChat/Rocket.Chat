/** An email an App sends through `IEmailCreator.send`. */
export interface IEmail {
	/** Who receives the email. */
	to: string | string[];
	/**
	 * Who the email comes from.
	 *
	 * @deprecated this will be inferred from the settings
	 */
	from?: string;
	/** Where replies should go, when that is not the sender. */
	replyTo?: string;
	/** The email's subject line. */
	subject: string;
	/** The email's HTML body. */
	html?: string;
	/** The email's plain text body, for clients that do not render HTML. */
	text?: string;
	/** Extra headers to put on the message. */
	headers?: string;
}
