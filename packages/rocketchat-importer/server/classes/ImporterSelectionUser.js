/* globals Importer */
// Class for the selection users for ImporterSelection
Importer.SelectionUser = (Importer.SelectionUser = class SelectionUser {
	// Constructs a new selection user.
	//
	// @param [String] user_id the unique user identifier
	// @param [String] username the user's username
	// @param [String] email the user's email
	// @param [Boolean] is_deleted whether the user was deleted or not
	// @param [Boolean] is_bot whether the user is a bot or not
	// @param [Boolean] do_import whether we are going to import this user or not
	//
	constructor(user_id, username, email, is_deleted, is_bot, do_import) {
		this.user_id = user_id;
		this.username = username;
		this.email = email;
		this.is_deleted = is_deleted;
		this.is_bot = is_bot;
		this.do_import = do_import;
	}
});
//TODO: Add some verification?
