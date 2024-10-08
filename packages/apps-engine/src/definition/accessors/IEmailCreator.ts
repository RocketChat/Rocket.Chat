import type { IEmail } from '../email';

export interface IEmailCreator {
    /**
     * Sends an email through Rocket.Chat
     *
     * @param email the email data
     */
    send(email: IEmail): Promise<void>;
}
