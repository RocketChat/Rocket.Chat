import type { IEmailDescriptor } from './IEmailDescriptor';

/** The email an `IPreEmailSent` handler may rewrite, and what prompted it. */
export interface IPreEmailSentContext {
	/** What the workspace was doing when it decided to send, the mailer's own payload. */
	context: unknown;
	/** The email as it stands. */
	email: IEmailDescriptor;
}
