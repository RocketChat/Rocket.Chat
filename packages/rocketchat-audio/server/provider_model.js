/**
 * Setting Object in order to manage settings loading for providers and admin ui display
 */

/*eslint no-unused-vars: [2, { "args": "none" }]*/

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
		return `VoiceRecognition.${ this._basekey }.${ this.key }`;
	}

	load() {
		this._value = RocketChat.settings.get(this.id);

		if (this._value === undefined) { this._value = this.defaultValue; }
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
		return Object.keys(this.settings).map(key => this.settings[key]);
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
		Object.keys(this.settings).forEach((key) => {
			this.settings[key].load();
		});
	}
}

export default class RecognitionProvider {

	/**
         * Creater recognition provider, key must match /^[a-z0-9]+$/
         * @param key
         */
	constructor(key) {

		if (!key.match(/^[A-z0-9]+$/)) { throw new Error(`cannot instantiate provider: ${ key } does not match key-pattern`); }

		console.log(`create search provider ${ key }`);

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

	/*--- livecycle ---*/
	run(reason, callback) {
		return new Promise((resolve, reject) => {
			this._settings.load();
			this.start(reason, resolve, reject);
		});
	}

	start(reason, resolve) {
		resolve();
	}

	stop(resolve) {
		resolve();
	}
}
