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

const SORTER = {};
const getValue = (value, type) => {
	if (value.toLowerCase() === 'true') {
		return true;
	}

	if (value.toLowerCase() === 'false') {
		return false;
	}

	if (type === 'int') {
		return parseInt(value);
	}
};

const prepare = (value) => ({
	processEnvValue: getValue(value),
	valueSource: 'processEnvValue',
});

/*
* Add a setting
* @param {String} _id
* @param {Mixed} value
* @param {Object} setting
*/

settings.add = function add(_id, value, { i18nDefaultQuery, force, enableQuery, sorter, editor, ...options } = {}) {
	if (!_id || value == null) {
		return false;
	}

	if (SORTER[options.group] == null) {
		SORTER[options.group] = 0;
	}

	const ENV_VALUE = process.env[`OVERWRITE_SETTING_${ _id }`];

	const op = {
		secret: false,
		autocomplete: true,
		i18nLabel: _id,
		i18nDescription: `${ _id }_Description`,
		editor,
		...options,
		...enableQuery && { enableQuery: JSON.stringify(enableQuery) },
		...i18nDefaultQuery && { i18nDefaultQuery: JSON.stringify(i18nDefaultQuery) },
		...hiddenSettings[_id] !== null && { hidden: !!hiddenSettings[_id] },
		...blockedSettings[_id] !== null && { blocked: !!blockedSettings[_id] },
		packageValue: value,
		valueSource: 'packageValue',
		sorter: sorter || SORTER[options.group]++,
	};

	if (process.env[_id]) {
		Object.assign(op, prepare(process.env[_id], options.type));
	}

	if (ENV_VALUE) {
		Object.assign(op, prepare(ENV_VALUE, options.type), { value: ENV_VALUE });
	}

	const updateOperations = {
		$set: {
			...op,
		},
		...options.section == null && { $unset: { section: 1 } },
	};

	const $setOnInsert = {
		ts: new Date(),
		...op.value == null && { value },
		createdAt: new Date(),
		...editor && { editor },
	};

	if (op.value == null) {
		if (force === true) {
			updateOperations.$set.value = op.packageValue;
		}
	}

	const query = {
		_id,
		...updateOperations.$set,
		...!options.section && { section: {
			$exists: false,
		} },
	};

	const existantSetting = Settings.findOne(query, { fields: { _id: 1 } });

	if (existantSetting) {
		return;
	}

	if (!Settings.findOne({ _id }, { fields: { _id: 1 } })) {
		return Settings.upsert({
			_id,
		}, { ...updateOperations, $setOnInsert });
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
