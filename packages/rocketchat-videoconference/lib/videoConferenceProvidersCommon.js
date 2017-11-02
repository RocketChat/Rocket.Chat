this.videoConferenceProvidersCommon = class {
	constructor() {
		this.providers = {};
	}

	/* Adds a video conference type to app
	@param identifier An identifier to the video conference type.
	@param config
	icon: icon class
	label: i18n label
	route:
	name: route name
	action: route action function
	identifier: room type identifier
	*/

	add(identifier, config) {
		if (this.providers[identifier] != null) {
			return false;
		}

		this.providers[identifier] = {...config, identifier};
	}

	get(identifier) {
		return this.providers[identifier];
	}
};
export default this.roomTypesCommon;
