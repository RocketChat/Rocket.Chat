import { ConferenceCallProvider } from './conferenceCallProvider';

export class ConferenceCallProvidersCommon {
	constructor() {
		this._providers = {};
	}

	/* Adds a video conference type to app
	@param identifier An identifier to the video conference type.
	@param provider ConferenceCallProvider object.
	*/

	get providers() {
		return this._providers;
	}

	add(provider) {
		if (!(provider) instanceof ConferenceCallProvider) {
			throw new Error('Invalid Conference Call Provider Configuration object, it must extend "ConferenceCallProvider"');
		}

		if (this._providers[provider.id] != null) {
			return false;
		}

		this._providers[provider.id] = {...provider};
	}

	getProvider(id) {
		return this._providers[id];
	}

	getActiveProvider() {
		return this.getProvider(RocketChat.settings.get('ConferenceCall_Provider'));
	}
}
