/*eslint no-unused-vars: [2, { "args": "none" }]*/
import _ from 'underscore';
import SearchLogger from '../logger/logger';

/**
 * Setting Object in order to manage settings loading for providers and admin ui display
 */
class Setting {
	constructor(basekey, key, type, defaultValue, options = {}) {
		this._basekey = basekey;
		this.key = key;
		this.type = type;
		this.defaultValue = defaultValue;
		this.options = options;
		this._value = undefined;
	}

	get value() {
		return this._value;
	}

	/**
	 * Id is generated based on baseKey and key
	 * @returns {string}
	 */
	get id() {
		return `Search.${ this._basekey }.${ this.key }`;
	}

	load() {
		this._value = RocketChat.settings.get(this.id) || this.defaultValue;
	}

}

/**
 * Settings Object allows to manage Setting Objects
 */
class Settings {
	constructor(basekey) {
		this.basekey = basekey;
		this.settings = {};
	}

	add(key, type, defaultValue, options) {
		this.settings[key] = new Setting(this.basekey, key, type, defaultValue, options);
	}

	list() {
		return _.values(this.settings);
	}

	map() {
		return this.settings;
	}

	/**
	 * return the value for key
	 * @param key
	 */
	get(key) {
		if (!this.settings[key]) { throw new Error('Setting is not set'); }
		return this.settings[key].value;
	}

	/**
	 * load currently stored values of all settings
	 */
	load() {
		_.each(this.settings, (setting) => {
			setting.load();
		});
	}
}

export default class SearchProvider {

	/**
	 * Create search provider, key must match /^[a-z0-9]+$/
	 * @param key
	 */
	constructor(key) {

		if (!key.match(/^[A-z0-9]+$/)) { throw new Error(`cannot instantiate provider: ${ key } does not match key-pattern`); }

		SearchLogger.info(`create search provider ${ key }`);

		this._key = key;
		this._settings = new Settings(key);
	}

	/*--- basic params ---*/
	get key() {
		return this._key;
	}

	get i18nLabel() {
		return undefined;
	}

	get i18nDescription() {
		return undefined;
	}

	get settings() {
		return this._settings.list();
	}

	get settingsAsMap() {
		return this._settings.map();
	}

	/*--- templates ---*/
	get resultTemplate() {
		return 'DefaultSearchResultTemplate';
	}

	get suggestionItemTemplate() {
		return 'DefaultSuggestionItemTemplate';
	}

	/*--- search functions ---*/
	/**
	 * Search using the current search provider and check if results are valid for the user. The search result has
	 * the format {messages:{start:0,numFound:1,docs:[{...}]},users:{...},rooms:{...}}
	 * @param text the search text
	 * @param context the context (uid, rid)
	 * @param payload custom payload (e.g. for paging)
	 * @param callback is used to return result an can be called with (error,result)
	 */
	search(text, context, payload, callback) {
		throw new Error('Function search has to be implemented');
	}

	/**
	 * Returns an ordered list of suggestions. The result should have at least the form [{text:string}]
	 * @param text
	 * @param context
	 * @param payload
	 * @param callback
	 */
	suggest(text, context, payload, callback) {
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
	run(reason, callback) {
		this._settings.load();
		this.start(reason, callback);
	}

	start(reason, callback) {
		callback();
	}

	stop(callback) {
		callback();
	}
}

