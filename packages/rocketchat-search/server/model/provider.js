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

		if (!key.match(/^[a-z0-9]+$/)) { throw new Error(`cannot instantiate provider: ${ key } does not match key-pattern`); }

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
		return undefined;
	}

	/*--- search functions ---*/
	search(text, context, payload, callback) {
		throw new Error('Function search has to be implemented');
	}

	suggest(text, callback) {
		callback(null, []);
	}

	get supportsSuggestions() {
		return false;
	}

	/*--- triggers ---*/
	on(name, value, payload) {
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

