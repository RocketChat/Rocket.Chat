import { Meteor } from 'meteor/meteor';
import _ from 'underscore';

import { settings } from '../../lib/settings';
import Settings from '../../../models/server/models/Settings';

const blockedSettings = {};

if (process.env.SETTINGS_BLOCKED) {
	process.env.SETTINGS_BLOCKED.split(',').forEach((settingId) => { blockedSettings[settingId] = 1; });
}

const hiddenSettings = {};
if (process.env.SETTINGS_HIDDEN) {
	process.env.SETTINGS_HIDDEN.split(',').forEach((settingId) => { hiddenSettings[settingId] = 1; });
}

settings._sorter = {};


/*
* Add a setting
* @param {String} _id
* @param {Mixed} value
* @param {Object} setting
*/

settings.add = function(_id, value, options = {}) {
	if (options == null) {
		options = {};
	}
	if (!_id || value == null) {
		return false;
	}
	if (settings._sorter[options.group] == null) {
		settings._sorter[options.group] = 0;
	}
	options.packageValue = value;
	options.valueSource = 'packageValue';
	options.hidden = options.hidden || false;
	options.blocked = options.blocked || false;
	if (options.sorter == null) {
		options.sorter = settings._sorter[options.group]++;
	}
	if (options.enableQuery != null) {
		options.enableQuery = JSON.stringify(options.enableQuery);
	}
	if (options.i18nDefaultQuery != null) {
		options.i18nDefaultQuery = JSON.stringify(options.i18nDefaultQuery);
	}
	if (typeof process !== 'undefined' && process.env && process.env[_id]) {
		value = process.env[_id];
		if (value.toLowerCase() === 'true') {
			value = true;
		} else if (value.toLowerCase() === 'false') {
			value = false;
		} else if (options.type === 'int') {
			value = parseInt(value);
		}
		options.processEnvValue = value;
		options.valueSource = 'processEnvValue';
	} else if (Meteor.settings && typeof Meteor.settings[_id] !== 'undefined') {
		if (Meteor.settings[_id] == null) {
			return false;
		}

		value = Meteor.settings[_id];
		options.meteorSettingsValue = value;
		options.valueSource = 'meteorSettingsValue';
	}
	if (options.i18nLabel == null) {
		options.i18nLabel = _id;
	}
	if (options.i18nDescription == null) {
		options.i18nDescription = `${ _id }_Description`;
	}
	if (blockedSettings[_id] != null) {
		options.blocked = true;
	}
	if (hiddenSettings[_id] != null) {
		options.hidden = true;
	}
	if (options.autocomplete == null) {
		options.autocomplete = true;
	}
	if (typeof process !== 'undefined' && process.env && process.env[`OVERWRITE_SETTING_${ _id }`]) {
		let value = process.env[`OVERWRITE_SETTING_${ _id }`];
		if (value.toLowerCase() === 'true') {
			value = true;
		} else if (value.toLowerCase() === 'false') {
			value = false;
		} else if (options.type === 'int') {
			value = parseInt(value);
		}
		options.value = value;
		options.processEnvValue = value;
		options.valueSource = 'processEnvValue';
	}
	const updateOperations = {
		$set: options,
		$setOnInsert: {
			createdAt: new Date(),
		},
	};
	if (options.editor != null) {
		updateOperations.$setOnInsert.editor = options.editor;
		delete options.editor;
	}
	if (options.value == null) {
		if (options.force === true) {
			updateOperations.$set.value = options.packageValue;
		} else {
			updateOperations.$setOnInsert.value = value;
		}
	}
	const query = _.extend({
		_id,
	}, updateOperations.$set);
	if (options.section == null) {
		updateOperations.$unset = {
			section: 1,
		};
		query.section = {
			$exists: false,
		};
	}
	const existantSetting = Settings.db.findOne(query);
	if (existantSetting != null) {
		if (existantSetting.editor == null && updateOperations.$setOnInsert.editor != null) {
			updateOperations.$set.editor = updateOperations.$setOnInsert.editor;
			delete updateOperations.$setOnInsert.editor;
		}
	} else {
		updateOperations.$set.ts = new Date();
	}
	return Settings.upsert({
		_id,
	}, updateOperations);
};


/*
* Add a setting group
* @param {String} _id
*/

settings.addGroup = function(_id, options = {}, cb) {
	if (!_id) {
		return false;
	}
	if (_.isFunction(options)) {
		cb = options;
		options = {};
	}
	if (options.i18nLabel == null) {
		options.i18nLabel = _id;
	}
	if (options.i18nDescription == null) {
		options.i18nDescription = `${ _id }_Description`;
	}
	options.ts = new Date();
	options.blocked = false;
	options.hidden = false;
	if (blockedSettings[_id] != null) {
		options.blocked = true;
	}
	if (hiddenSettings[_id] != null) {
		options.hidden = true;
	}
	Settings.upsert({
		_id,
	}, {
		$set: options,
		$setOnInsert: {
			type: 'group',
			createdAt: new Date(),
		},
	});
	if (cb != null) {
		cb.call({
			add(id, value, options) {
				if (options == null) {
					options = {};
				}
				options.group = _id;
				return settings.add(id, value, options);
			},
			section(section, cb) {
				return cb.call({
					add(id, value, options) {
						if (options == null) {
							options = {};
						}
						options.group = _id;
						options.section = section;
						return settings.add(id, value, options);
					},
				});
			},
		});
	}
};


/*
* Remove a setting by id
* @param {String} _id
*/

settings.removeById = function(_id) {
	if (!_id) {
		return false;
	}
	return Settings.removeById(_id);
};


/*
* Update a setting by id
* @param {String} _id
*/

settings.updateById = function(_id, value, editor) {
	if (!_id || value == null) {
		return false;
	}
	if (editor != null) {
		return Settings.updateValueAndEditorById(_id, value, editor);
	}
	return Settings.updateValueById(_id, value);
};


/*
* Update options of a setting by id
* @param {String} _id
*/

settings.updateOptionsById = function(_id, options) {
	if (!_id || options == null) {
		return false;
	}
	return Settings.updateOptionsById(_id, options);
};


/*
* Update a setting by id
* @param {String} _id
*/

settings.clearById = function(_id) {
	if (_id == null) {
		return false;
	}
	return Settings.updateValueById(_id, undefined);
};


/*
* Update a setting by id
*/

settings.init = function() {
	settings.initialLoad = true;
	Settings.find().observe({
		added(record) {
			Meteor.settings[record._id] = record.value;
			if (record.env === true) {
				process.env[record._id] = record.value;
			}
			return settings.load(record._id, record.value, settings.initialLoad);
		},
		changed(record) {
			Meteor.settings[record._id] = record.value;
			if (record.env === true) {
				process.env[record._id] = record.value;
			}
			return settings.load(record._id, record.value, settings.initialLoad);
		},
		removed(record) {
			delete Meteor.settings[record._id];
			if (record.env === true) {
				delete process.env[record._id];
			}
			return settings.load(record._id, undefined, settings.initialLoad);
		},
	});
	settings.initialLoad = false;
	settings.afterInitialLoad.forEach((fn) => fn(Meteor.settings));
};

settings.afterInitialLoad = [];

settings.onAfterInitialLoad = function(fn) {
	settings.afterInitialLoad.push(fn);
	if (settings.initialLoad === false) {
		return fn(Meteor.settings);
	}
};

export { settings };
