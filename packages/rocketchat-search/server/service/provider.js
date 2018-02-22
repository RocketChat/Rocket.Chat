/* globals SystemLogger */
export default class SearchProvider {

	constructor() {
		SystemLogger && SystemLogger.info(`create search provider ${ this.constructor.name }`);
		this.configuration = {};
	}

	/*--- basic params ---*/
	get id() {
		throw new Error('SearchProvider superclass has no id defined and should not be initiated');
	}

	get name() {
		return undefined;
	}

	get description() {
		return undefined;
	}

	/*--- templates ---*/
	get resultTemplate() {
		throw new Error('Result template has to be defined');
	}

	get suggestionItemTemplate() {
		return undefined;
	}

	get adminTemplate() {
		return undefined;
	}

	/*--- search functions ---*/
	search(text, rid, payload, callback) {
		throw new Error('Function search has to be implemented');
	}

	suggest(text, callback) {
		callback(null, []);
	}

	get supportsSuggestions() {
		return false;
	}

	/*--- triggers ---*/
	on(name, value) {
		return true;
	}

	/*--- livecycle ---*/
	init(configuration) {
		if (configuration) { this.configuration = configuration; }
		return this;
	}

	start(callback) {
		callback();
	}

	stop(callback) {
		callback();
	}
}

