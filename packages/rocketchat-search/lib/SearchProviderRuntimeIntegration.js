/**
 * This classes instance is being called during the chat runtime on relevant events.
 * All methods are called asynchronously and only provide an option to log.
 * All methods are considered {void}. Neither return-value nor callback allow interaction with the callee.
 * If user interaction shall be provided (e. g. rating a result), this has to be performed from a (custom) UI.
 */
export class SearchProviderRuntimeIntegration {

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
	onUserAdded(user, room, logger) {
		logger.info('User added propagated to search provider', room, user);
	}

	/**
	 * Callback after removing a user from a room
	 * Should be implemented by a search provider supporting permission-enabled searching
	 * @param room The room from which the user has been remove
	 * @param user The user who has just been removed
	 * @param logger A logger providing log-levels {error, warn, info/log, debug, success}
	 */
	onUserRemoved(user, room, logger) {
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

	/**
	 * When a search provider is getting activated, it needs to be provided the current state of the system which it
	 * can index. This process is called "initial load".
	 * In order to do this at good performance, Mongo-cursors of the entities to be indexed are passed.
	 * @param roomsCursor A Mongo cursor to a search-relevant-projection of the rooms collection
	 * @param messagesCursor A Mongo cursor to a search-relevant-projection of the messages collection
	 * @param usersCursor A Mongo cursor to a search-relevant-projection of the users collection
	 * @param rolesCursor A Mongo cursor to a search-relevant-projection of the roles collection
	 * @param permissionsCursor A Mongo cursor to a search-relevant-projection of the permissions collection
	 * @param logger A logger providing log-levels {error, warn, info/log, debug, success}
	 * @param initialLoadCompletedCallback A callback which can shall be used to signal to Rocket.Chat core that the
	 * initial load is completed now. This will switch the fulltext search to be indicated as "ready" to the end-user.
	 * The callback takes only one argument: ready ({boolean})
	 */
	initialLoad(/* roomsCursor, messagesCursor, usersCursor, rolesCursor, permissionsCursor, logger, initialLoadCompletedCallback */) {

	}
}
