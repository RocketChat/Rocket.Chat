import type { RocketChatAssociationModel } from '../metadata';
import type { IUser, IUserEmail } from '../users';

/**
 * Interface for creating a user.
 * Please note, a username and email provided must be unique else you will NOT
 * be able to successfully save the user object.
 */
export interface IUserBuilder {
    kind: RocketChatAssociationModel.USER;

    /**
     * Provides a convient way to set the data for the user.
     * Note: Providing an "id" field here will be ignored.
     *
     * @param user the user data to set
     */
    setData(user: Partial<IUser>): IUserBuilder;

    /**
     * Sets emails of the user
     *
     * @param emails the array of email addresses of the user
     */
    setEmails(emails: Array<IUserEmail>): IUserBuilder;

    /**
     * Gets emails of the user
     */
    getEmails(): Array<IUserEmail>;

    /**
     * Sets the display name of this user.
     *
     * @param name the display name of the user
     */
    setDisplayName(name: string): IUserBuilder;

    /**
     * Gets the display name of this user.
     */
    getDisplayName(): string;

    /**
     * Sets the username for the user
     *
     * @param username username of the user
     */
    setUsername(username: string): IUserBuilder;

    /**
     * Gets the username of this user
     */
    getUsername(): string;

    /**
     * Gets the user
     */
    getUser(): Partial<IUser>;
}
