import {SearchProviderRuntime} from './SearchProviderRuntime';
import {SearchProviderMetadata} from './SearchProviderMetadata';
import {SearchProviderUi} from './SearchProviderUi';

/**
 * A search provider is an implementation of a full-text-search within Rocket.Chat
 * As such, it is integrated during the search-relevant events at runtime.
 * It may provide own UI elements or re-use generic UI components
 */
export class SearchProvider {
	constructor(identifier, runtime, metadata, ui) {
		if (!(runtime instanceof SearchProviderRuntime)) {
			throw new Error('Invalid runtime object, it must extend "SearchProviderRuntime"');
		}

		if (!(metadata instanceof SearchProviderMetadata)) {
			throw new Error('Invalid metadata object, it must extend "SearchProviderMetadata"');
		}

		if (!(ui instanceof SearchProviderUi)) {
			throw new Error('Invalid ui object, it must extend "SearchProviderUi"');
		}

		this._identifier = identifier;
		this._runtime = runtime;
		this._metadata = metadata;
		this._ui = ui;
	}

	get identifier() {
		return this._identifier;
	}

	get runtime() {
		return this._runtime;
	}

	get metadata() {
		return this._metadata;
	}

	get ui() {
		return this._ui;
	}
}
