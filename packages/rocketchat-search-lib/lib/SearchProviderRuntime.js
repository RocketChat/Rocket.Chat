/**
 * This classes instance is being called during the chat runtime on relevant events.
 * All methods are called asynchronously and only provide an option to log.
 * All methods are considered {void}. Neither return-value nor callback allow interaction with the callee.
 * If user interaction shall be provided (e. g. rating a result), this has to be performed from a (custom) UI.
 */
export class SearchProviderRuntime {

	/**
	 * Callback after sending of a message
	 * Needs to be implemented by a search provider in order to retrun proper results
	 * @param message The message which has just been sent by a user or a bot
	 * @param logger A logger providing log-levels {error, warn, info/log, debug, success}
	 */
	onMessageSent(message, logger) {
		logger.info('Message sent to search provider', message);
		throw new Error('onMessageSent needs to be redefined');
	}

	/**
	 * Callback after a message has been edited by a user
	 * Needs to be implemented by a search provider in order to retrun proper results
	 * @param message The message which has just been updated
	 * @param logger A logger providing log-levels {error, warn, info/log, debug, success}
	 */
	onMessageUpdated(message, logger) {
		logger.info('Message update propagated to search provider', message);
		throw new Error('onMessageUpdated needs to be redefined');
	}

	/**
	 * Callback after adding a user to a room
	 * Should be implemented by a search provider supporting permission-enabled searching
	 * @param room The room to which the user has been added
	 * @param user The user who has just been added
	 * @param logger A logger providing log-levels {error, warn, info/log, debug, success}
	 */
	onUserAdded(room, user, logger) {
		logger.info('User added propagated to search provider', room, user);
	}

	/**
	 * Callback after removing a user from a room
	 * Should be implemented by a search provider supporting permission-enabled searching
	 * @param room The room from which the user has been remove
	 * @param user The user who has just been removed
	 * @param logger A logger providing log-levels {error, warn, info/log, debug, success}
	 */
	onUserRemoved(room, user, logger) {
		logger.info('User removed propagated to search provider', room, user);
	}

	/**
	 * Callback after a user's roles have been changed.
	 * Should be implemented by a search provider supporting permission-enabled searching
	 * @param user the user who's roles have been changed
	 * @param roles the new roles the user has
	 * @param logger A logger providing log-levels {error, warn, info/log, debug, success}
	 */
	onUserRolesChanged(user, roles, logger) {
		logger.info('User role change propagated to search provider', user, roles);
	}

	/**
	 * Callback after changing a role definition
	 * @param role The role which has been changed
	 * @param permissions The updated permissions which are relevant to search (all view*-permissions)
	 * @param logger A logger providing log-levels {error, warn, info/log, debug, success}
	 */
	onRoleChanged(role, permissions, logger) {
		logger.info('Role change propagated to search provider', role, permissions);
	}
}
