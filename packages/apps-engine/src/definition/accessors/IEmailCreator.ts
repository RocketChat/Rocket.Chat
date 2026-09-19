import type { IEmail } from '../email';

/**
 * Sends email through the workspace's own mailer.
 *
 * The workspace supplies the sender and the transport, so an App does not
 * carry mail server credentials. It needs the `email.send` permission.
 */
export interface IEmailCreator {
	/**
	 * Sends an email through Rocket.Chat
	 *
	 * @param email the email data
	 */
	send(email: IEmail): Promise<void>;
}
