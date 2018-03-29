export class SelectionUser {
	/**
	 * Constructs a new selection user.
	 *
	 * @param {string} user_id the unique user identifier
	 * @param {string} username the user's username
	 * @param {string} email the user's email
	 * @param {boolean} is_deleted whether the user was deleted or not
	 * @param {boolean} is_bot whether the user is a bot or not
	 * @param {boolean} do_import whether we are going to import this user or not
	 */
	constructor(user_id, username, email, is_deleted, is_bot, do_import) {
		this.user_id = user_id;
		this.username = username;
		this.email = email;
		this.is_deleted = is_deleted;
		this.is_bot = is_bot;
		this.do_import = do_import;
	}
}
