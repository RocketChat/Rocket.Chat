/**
 * What the workspace should do while it creates a user, beyond writing the
 * record itself.
 *
 * These are one-off instructions, not part of the account: nothing here can be
 * read back from the resulting {@link users/IUser!IUser | IUser}.
 */
export interface IUserCreationOptions {
	/** An image to fetch and set as the new user's avatar. */
	avatarUrl?: string;
	/** Whether to subscribe the user to the workspace's default channels. */
	joinDefaultChannels?: boolean;
	/** Whether to mark the user's email address as already proven. */
	verified?: boolean;
	/** Whether to make the user choose a new password at their first login. */
	requirePasswordChange?: boolean;
	/** Whether to email the user that their account exists. */
	sendWelcomeEmail?: boolean;
}
