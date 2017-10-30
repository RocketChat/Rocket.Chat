/**
 * The UI for the search results is provided generically.
 * However, search providers may bring their own templates in order to provide unique features
 */
export class SearchProviderUi {
	/**
	 * The label with which the search is being visualized on the UI
	 * @return {string} text or i18n text key
	 */
	get displayName() {
		throw new Error('Needs to be redefined');
	}

	/**
	 * A description which informs the user about the search provider's capabilities when
	 * configuring it
	 * @return {string} text or i18n text key
	 */
	get description() {
		return '';
	}

	/**
	 * A visualization which holds the list of result elements.
	 * The container may provide features which affect the visible list of results such as faceting, paging, sorting
	 * @return {string} the Blaze template name
	 */
	get resultsContainerTemplate() {
		return 'searchResultsContainer';
	}

	/**
	 * A visualization which presents the individual search result.
	 * By default, a search result targets a room. However, if individual messages are adressable, a custom template
	 * may be provided which then handle the navigation to the message itself.
	 * @return {string} the Blaze template name
	 */
	get resultTemplate() {
		return 'searchResultRoom';
	}
}
