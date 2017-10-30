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
}
