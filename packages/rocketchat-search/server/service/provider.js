/* globals SystemLogger */
import _ from 'underscore';

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

	get id() {
		return `Search.${ this._basekey }.${ this.key }`;
	}

	load() {
		this._value = RocketChat.settings.get(this.id) || this.defaultValue;
	}

}

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

	get(key) {
		if (!this.settings[key]) { throw new Error('Setting is not set'); }
		return this.settings[key].value;
	}

	load() {
		_.each(this.settings, (setting) => {
			setting.load();
		});
	}
}

export default class SearchProvider {

	constructor(key) {
		SystemLogger && SystemLogger.info(`create search provider ${ key }`);
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
	run(callback) {
		this._settings.load();
		this.start(callback);
	}

	start(callback) {
		callback();
	}

	stop(callback) {
		callback();
	}
}

