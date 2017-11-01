import {SearchProviderRuntimeIntegration} from './SearchProviderRuntimeIntegration';
import {SearchProviderMetadata} from './SearchProviderMetadata';
import {SearchProviderUi} from './SearchProviderUi';

/**
 * A search provider is an implementation of a full-text-search within Rocket.Chat
 * As such, it is integrated during the search-relevant events at runtime.
 * It may provide own UI elements or re-use generic UI components
 */
export class SearchProvider {
	constructor(identifier, runtimeIntegration, metadata, ui) {
		if (!(runtimeIntegration instanceof SearchProviderRuntimeIntegration)) {
			throw new Error('Invalid runtimeIntegration object, it must extend "SearchProviderRuntimeIntegration"');
		}

		if (!(metadata instanceof SearchProviderMetadata)) {
			throw new Error('Invalid metadata object, it must extend "SearchProviderMetadata"');
		}

		if (!(ui instanceof SearchProviderUi)) {
			throw new Error('Invalid ui object, it must extend "SearchProviderUi"');
		}

		this._identifier = identifier;

		this._metadata = metadata;

		// restrict visibility of components to the tier they are used on
		if (Meteor.isServer) {
			this._runtimeIntegration = runtimeIntegration;
		}

		if (Meteor.isClient) {
			this._ui = ui;
		}
	}

	get identifier() {
		return this._identifier;
	}

	/*
	As an alternative to interfaces, we use composition in order to group features and methods
	 */

	/**
	 * Interface for integrating the search provider in the transaction process of executing Rocket.Chat
	 * @return {SearchProviderRuntimeIntegration}
	 */
	get runtimeIntegration() {
		return this._runtimeIntegration;
	}

	/**
	 * Interface for retrieving infromatino about the search provider which are used for configuration of the provider
	 * or for triggering switches in the caller
	 * @return {SearchProviderMetadata}
	 */
	get metadata() {
		return this._metadata;
	}

	/**
	 * Interface for everything related to the user interface. This includes the actual UI components as well as all
	 * kinds of text presented to the end-user
	 * @return {SearchProviderUi}
	 */
	get ui() {
		return this._ui;
	}

	/*
	The following methods are the actual core of the search
	 */

	/**
	 * Perform a full-text-search for rooms. The content which is searched may depend on the provider.
	 * Potential sources are all properties handed over during replication
	 * @param searchText The text as entered by the user. Caution: there's no escaping done by the consumer. Protection
	 * for code injection needs to be performed by the implementaion
	 * @param userId The technical GUID of the user who executed the seach. This allows for integration of an ACL
	 * @param logger A logger providing log-levels {error, warn, info/log, debug, success}
	 * @return {Array} //todo: Define format of the result instance
	 */
	findRooms(searchText, userId, logger) {
		logger.debug('Search for rooms triggered by', userId, 'with search text', searchText);
		return [];
	}

}
