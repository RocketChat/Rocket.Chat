import { EventEmitter } from 'events';

import { Meteor } from 'meteor/meteor';
import _ from 'underscore';

import { SettingsBase } from '../../lib/settings';
import SettingsModel from '../../../models/server/models/Settings';
import { updateValue } from '../raw';
import { ISetting, SettingValue } from '../../../../definition/ISetting';

const blockedSettings = new Set<string>();
const hiddenSettings = new Set<string>();
const wizardRequiredSettings = new Set<string>();

if (process.env.SETTINGS_BLOCKED) {
	process.env.SETTINGS_BLOCKED.split(',').forEach((settingId) => blockedSettings.add(settingId.trim()));
}

if (process.env.SETTINGS_HIDDEN) {
	process.env.SETTINGS_HIDDEN.split(',').forEach((settingId) => hiddenSettings.add(settingId.trim()));
}

if (process.env.SETTINGS_REQUIRED_ON_WIZARD) {
	process.env.SETTINGS_REQUIRED_ON_WIZARD.split(',').forEach((settingId) => wizardRequiredSettings.add(settingId.trim()));
}

export const SettingsEvents = new EventEmitter();

const overrideSetting = (_id: string, value: SettingValue, options: ISettingAddOptions): SettingValue => {
	const envValue = process.env[_id];
	if (envValue) {
		if (envValue.toLowerCase() === 'true') {
			value = true;
		} else if (envValue.toLowerCase() === 'false') {
			value = false;
		} else if (options.type === 'int') {
			value = parseInt(envValue);
		} else {
			value = envValue;
		}
		options.processEnvValue = value;
		options.valueSource = 'processEnvValue';
	} else if (Meteor.settings[_id] != null && Meteor.settings[_id] !== value) {
		value = Meteor.settings[_id];
		options.meteorSettingsValue = value;
		options.valueSource = 'meteorSettingsValue';
	}

	const overwriteValue = process.env[`OVERWRITE_SETTING_${ _id }`];
	if (overwriteValue) {
		if (overwriteValue.toLowerCase() === 'true') {
			value = true;
		} else if (overwriteValue.toLowerCase() === 'false') {
			value = false;
		} else if (options.type === 'int') {
			value = parseInt(overwriteValue);
		} else {
			value = overwriteValue;
		}
		options.value = value;
		options.processEnvValue = value;
		options.valueSource = 'processEnvValue';
	}

	return value;
};

export interface ISettingAddOptions extends Partial<ISetting> {
	force?: boolean;
}

export interface ISettingAddGroupOptions {
	hidden?: boolean;
	blocked?: boolean;
	ts?: Date;
	i18nLabel?: string;
	i18nDescription?: string;
}


interface IUpdateOperator {
	$set: ISettingAddOptions;
	$setOnInsert: ISettingAddOptions & {
		createdAt: Date;
	};
	$unset?: {
		section?: 1;
	};
}

type QueryExpression = {
	$exists: boolean;
}

type Query<T> = {
	[P in keyof T]?: T[P] | QueryExpression;
}

type addSectionCallback = (this: {
	add(id: string, value: SettingValue, options: ISettingAddOptions): void;
}) => void;

type addGroupCallback = (this: {
	add(id: string, value: SettingValue, options: ISettingAddOptions): void;
	section(section: string, cb: addSectionCallback): void;
}) => void;

class Settings extends SettingsBase {
	private afterInitialLoad: Array<(settings: Meteor.Settings) => void> = [];

	private _sorter: {[key: string]: number} = {};

	private initialLoad = false;

	/*
	* Add a setting
	*/
	add(_id: string, value: SettingValue, { editor, ...options }: ISettingAddOptions = {}): boolean {
		if (!_id || value == null) {
			return false;
		}
		if (options.group && this._sorter[options.group] == null) {
			this._sorter[options.group] = 0;
		}
		options.packageValue = value;
		options.valueSource = 'packageValue';
		options.hidden = options.hidden || false;
		options.blocked = options.blocked || false;
		options.requiredOnWizard = options.requiredOnWizard || false;
		options.secret = options.secret || false;
		options.enterprise = options.enterprise || false;

		if (options.enterprise && !('invalidValue' in options)) {
			console.error(`Enterprise setting ${ _id } is missing the invalidValue option`);
			throw new Error(`Enterprise setting ${ _id } is missing the invalidValue option`);
		}

		if (options.group && options.sorter == null) {
			options.sorter = this._sorter[options.group]++;
		}
		if (options.enableQuery != null) {
			options.enableQuery = JSON.stringify(options.enableQuery);
		}
		if (options.i18nLabel == null) {
			options.i18nLabel = _id;
		}
		if (options.i18nDescription == null) {
			options.i18nDescription = `${ _id }_Description`;
		}
		if (blockedSettings.has(_id)) {
			options.blocked = true;
		}
		if (hiddenSettings.has(_id)) {
			options.hidden = true;
		}
		if (wizardRequiredSettings.has(_id)) {
			options.requiredOnWizard = true;
		}
		if (options.autocomplete == null) {
			options.autocomplete = true;
		}

		value = overrideSetting(_id, value, options);

		const updateOperations: IUpdateOperator = {
			$set: options,
			$setOnInsert: {
				createdAt: new Date(),
			},
		};
		if (editor != null) {
			updateOperations.$setOnInsert.editor = editor;
			updateOperations.$setOnInsert.packageEditor = editor;
		}

		if (options.value == null) {
			if (options.force === true) {
				updateOperations.$set.value = options.packageValue;
			} else {
				updateOperations.$setOnInsert.value = value;
			}
		}

		const query: Query<ISettingAddOptions> = {
			_id,
			...updateOperations.$set,
		};

		if (options.section == null) {
			updateOperations.$unset = {
				section: 1,
			};
			query.section = {
				$exists: false,
			};
		}

		const existentSetting = SettingsModel.findOne(query);
		if (existentSetting) {
			if (existentSetting.editor || !updateOperations.$setOnInsert.editor) {
				return true;
			}

			updateOperations.$set.editor = updateOperations.$setOnInsert.editor;
			delete updateOperations.$setOnInsert.editor;
		}

		updateOperations.$set.ts = new Date();

		SettingsModel.upsert({
			_id,
		}, updateOperations);

		const record = {
			_id,
			value,
			type: options.type || 'string',
			env: options.env || false,
			i18nLabel: options.i18nLabel,
			public: options.public || false,
			packageValue: options.packageValue,
			blocked: options.blocked,
		};

		this.storeSettingValue(record, this.initialLoad);

		return true;
	}

	/*
	* Add a setting group
	*/
	addGroup(_id: string, cb?: addGroupCallback): boolean;

	// eslint-disable-next-line no-dupe-class-members
	addGroup(_id: string, options: ISettingAddGroupOptions | addGroupCallback = {}, cb?: addGroupCallback): boolean {
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

		options.blocked = false;
		options.hidden = false;
		if (blockedSettings.has(_id)) {
			options.blocked = true;
		}
		if (hiddenSettings.has(_id)) {
			options.hidden = true;
		}

		const existentGroup = SettingsModel.findOne({
			_id,
			type: 'group',
			...options,
		});

		if (!existentGroup) {
			options.ts = new Date();

			SettingsModel.upsert({
				_id,
			}, {
				$set: options,
				$setOnInsert: {
					type: 'group',
					createdAt: new Date(),
				},
			});
		}

		if (cb != null) {
			cb.call({
				add: (id: string, value: SettingValue, options: ISettingAddOptions = {}) => {
					options.group = _id;
					return this.add(id, value, options);
				},
				section: (section: string, cb: addSectionCallback) => cb.call({
					add: (id: string, value: SettingValue, options: ISettingAddOptions = {}) => {
						options.group = _id;
						options.section = section;
						return this.add(id, value, options);
					},
				}),
			});
		}
		return true;
	}

	/*
	* Remove a setting by id
	*/
	removeById(_id: string): boolean {
		if (!_id) {
			return false;
		}
		return SettingsModel.removeById(_id);
	}

	/*
	* Update a setting by id
	*/
	updateById(_id: string, value: SettingValue, editor?: string): boolean {
		if (!_id || value == null) {
			return false;
		}
		if (editor != null) {
			return SettingsModel.updateValueAndEditorById(_id, value, editor);
		}
		return SettingsModel.updateValueById(_id, value);
	}

	/*
	* Update options of a setting by id
	*/
	updateOptionsById(_id: string, options: ISettingAddOptions): boolean {
		if (!_id || options == null) {
			return false;
		}

		return SettingsModel.updateOptionsById(_id, options);
	}

	/*
	* Update a setting by id
	*/
	clearById(_id: string): boolean {
		if (_id == null) {
			return false;
		}
		return SettingsModel.updateValueById(_id, undefined);
	}

	/*
	* Change a setting value on the Meteor.settings object
	*/
	storeSettingValue(record: ISetting, initialLoad: boolean): void {
		const newData = {
			value: record.value,
		};
		SettingsEvents.emit('store-setting-value', record, newData);
		const { value } = newData;

		Meteor.settings[record._id] = value;
		if (record.env === true) {
			process.env[record._id] = String(value);
		}

		this.load(record._id, value, initialLoad);
	}

	/*
	* Remove a setting value on the Meteor.settings object
	*/
	removeSettingValue(record: ISetting, initialLoad: boolean): void {
		SettingsEvents.emit('remove-setting-value', record);

		delete Meteor.settings[record._id];
		if (record.env === true) {
			delete process.env[record._id];
		}

		this.load(record._id, undefined, initialLoad);
	}

	/*
	* Update a setting by id
	*/
	init(): void {
		this.initialLoad = true;
		SettingsModel.find().fetch().forEach((record: ISetting) => {
			this.storeSettingValue(record, this.initialLoad);
			updateValue(record._id, { value: record.value });
		});
		this.initialLoad = false;
		this.afterInitialLoad.forEach((fn) => fn(Meteor.settings));
	}

	onAfterInitialLoad(fn: (settings: Meteor.Settings) => void): void {
		this.afterInitialLoad.push(fn);
		if (this.initialLoad === false) {
			fn(Meteor.settings);
		}
	}
}

export const settings = new Settings();
