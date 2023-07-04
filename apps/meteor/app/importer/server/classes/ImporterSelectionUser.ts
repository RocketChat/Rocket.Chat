import type { IImporterSelectionUser } from '@rocket.chat/core-typings';

export class SelectionUser implements IImporterSelectionUser {
	public user_id: string;

	public username: string | undefined;

	public email: string;

	public is_deleted: boolean;

	public is_bot: boolean;

	public do_import: boolean;

	public is_email_taken: boolean;

	/**
	 * Constructs a new selection user.
	 *
	 * @param user_id the unique user identifier
	 * @param username the user's username
	 * @param email the user's email
	 * @param is_deleted whether the user was deleted or not
	 * @param is_bot whether the user is a bot or not
	 * @param do_import whether we are going to import this user or not
	 * @param is_email_taken whether there's an existing user with the same email
	 */
	constructor(
		/* eslint-disable @typescript-eslint/naming-convention */
		user_id: string,
		username: string | undefined,
		email: string,
		is_deleted: boolean,
		is_bot: boolean,
		do_import: boolean,
		is_email_taken = false,
		/* eslint-enable @typescript-eslint/naming-convention */
	) {
		this.user_id = user_id;
		this.username = username;
		this.email = email;
		this.is_deleted = is_deleted;
		this.is_bot = is_bot;
		this.do_import = do_import;
		this.is_email_taken = is_email_taken;
	}
}
