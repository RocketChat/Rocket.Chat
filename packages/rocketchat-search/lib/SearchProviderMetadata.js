export class SearchProviderMetadata {
	/**
	 * Indicates towards Rocket.Chat whether the search provider validates permissions when searching.
	 * This makes it necessary that the search provider reacts on users joining and reaving a room as well as changes
	 * to permissions configuration.
	 * If this method is not implemented, Rocket.Chat will do a pre- and post-search-filtering in order to ensure that
	 * the user searching does not find messages from rooms in which he's not authorized.
	 * @return {boolean} Whether the search provider validates permissions when performing the search
	 */
	supportsPermissions() {
		return false;
	}

	/**
	 * Rocket.Chat will generically create a section for all search providers.
	 * Within this method, settings can be added
	 * @see packages/rocketchat-lib/server/functions/settings.js:22
	 * @param section for this particular search provider
	 * @param settingsHandler a wrapper for settings which keeps track of the settings created (for invalidation)
	 * @param logger A logger providing log-levels {error, warn, info/log, debug, success}
	 */
	addSettings(section, settingsHandler, logger) {
		logger.debug('Adding settings to', section._id);
		/*
		use section.add(_id, value, options = {})
		where most relevant options = {
			hidden,
			blocked,
			i18nLabel,
			i18nDescription
		}
		*/
	}

	/**
	 * As search providers bring their own configuration, this configuration is validated before activating the provider
	 * @param logger A logger providing log-levels {error, warn, info/log, debug, success}
	 * @return {boolean} indicates whether the settings are consitent and the search provider can act based upon the
	 */
	isConfigurationValid(logger) {
		logger.debug('Search provider asked for validation', this.constructor.name);
		return true;
	}
}
