import { Emitter } from '@rocket.chat/emitter';
import { Meteor } from 'meteor/meteor';

import { SettingsBase } from '../../lib/settings';
import SettingsModel from '../../../models/server/models/Settings';
import { updateValue } from '../raw';
import { ISetting, ISettingColor, ISettingGroup, isSettingColor, isSettingEnterprise, SettingValue } from '../../../../definition/ISetting';
import { SystemLogger } from '../../../../server/lib/logger/system';

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

export const SettingsEvents = new Emitter<{
	'store-setting-value': [ISetting, { value: SettingValue }];
	'fetch-settings': ISetting[];
	'remove-setting-value': ISetting;
	'after-initial-load': Meteor.Settings;
}>();

const convertValue = (value: 'true' | 'false' | string, type: ISetting['type']): SettingValue => {
	if (value.toLowerCase() === 'true') {
		return true;
	}
	if (value.toLowerCase() === 'false') {
		return false;
	}
	if (type === 'int') {
		return parseInt(value);
	}
	return value;
};


const overrideSetting = (setting: ISetting): ISetting => {
	const overwriteValue = process.env[setting._id];
	if (!overwriteValue) {
		return setting;
	}

	const value = convertValue(overwriteValue, setting.type);

	if (value === setting.value) {
		return setting;
	}

	return {
		...setting,
		value,
		processEnvValue: value,
		valueSource: 'processEnvValue',
	};
};

const overwriteSetting = (setting: ISetting): ISetting => {
	const overwriteValue = process.env[`OVERWRITE_SETTING_${ setting._id }`];
	if (!overwriteValue) {
		return setting;
	}

	const value = convertValue(overwriteValue, setting.type);

	if (value === setting.value) {
		return setting;
	}

	SystemLogger.log(`Overwriting setting ${ setting._id }`);

	return {
		...setting,
		value,
		processEnvValue: value,
		// blocked: true, TODO: add this back
		valueSource: 'processEnvValue',
	};
};

const getGroupDefaults = (_id: string, options: ISettingAddGroupOptions = {}): ISettingGroup => ({
	_id,
	i18nLabel: _id,
	i18nDescription: `${ _id }_Description`,
	...options,
	blocked: blockedSettings.has(_id),
	hidden: hiddenSettings.has(_id),
	type: 'group',
	...options.displayQuery && { displayQuery: JSON.stringify(options.displayQuery) },
});

export type ISettingAddGroupOptions = Partial<ISettingGroup>;

// interface IUpdateOperator {
// 	$set: ISettingAddOptions;
// 	$setOnInsert: ISettingAddOptions & {
// 		createdAt: Date;
// 	};
// 	$unset?: {
// 		section?: 1;
// 	};
// }

type addSectionCallback = (this: {
	add(id: string, value: SettingValue, options: ISettingAddOptions): void;
	with(options: ISettingAddOptions, cb: addSectionCallback): void;
}) => void;

type addGroupCallback = (this: {
	add(id: string, value: SettingValue, options: ISettingAddOptions): void;
	section(section: string, cb: addSectionCallback): void;
	with(options: ISettingAddOptions, cb: addGroupCallback): void;
}) => void;


const getSettingDefaults = (setting: Partial<ISetting> & Pick<ISetting, '_id' | 'value' | 'type'>): ISetting => {
	const { _id, value, sorter, ...options } = setting;
	return {
		_id,
		value,
		packageValue: value,
		valueSource: 'packageValue',
		secret: false,
		enterprise: false,
		i18nDescription: `${ _id }_Description`,
		autocomplete: true,
		...sorter && { sorter },
		...options,
		...options.enableQuery && { enableQuery: JSON.stringify(options.enableQuery) },
		i18nLabel: options.i18nLabel || _id,
		hidden: options.hidden || hiddenSettings.has(_id),
		blocked: options.blocked || blockedSettings.has(_id),
		requiredOnWizard: options.requiredOnWizard || wizardRequiredSettings.has(_id),
		type: options.type || 'string',
		env: options.env || false,
		public: options.public || false,
		...options.displayQuery && { displayQuery: JSON.stringify(options.displayQuery) },
		...isSettingColor(setting as ISetting) && {
			packageEditor: (setting as ISettingColor).editor,
		},
	};
};

type ISettingAddOptions = Partial<ISetting>;

class Settings extends SettingsBase {
	static validate<T extends ISetting>(setting: T, value: T['value'] | unknown): boolean {
		switch (setting.type) {
			case 'asset':
				if (typeof value !== 'object') {
					throw new Meteor.Error('invalid-setting-value', `Setting ${ setting._id } is of type ${ setting.type } but got ${ typeof value }`);
				}
				break;
			case 'string':
			case 'relativeUrl':
			case 'password':
			case 'language':
			case 'color':
			case 'font':
			case 'code':
			case 'action':
			case 'roomPick':
			case 'group':
				if (typeof value !== 'string') {
					throw new Meteor.Error('invalid-setting-value', `Setting ${ setting._id } is of type ${ setting.type } but got ${ typeof value }`);
				}
				break;
			case 'boolean':
				if (typeof value !== 'boolean') {
					throw new Meteor.Error('invalid-setting-value', `Setting ${ setting._id } is of type boolean but got ${ typeof value }`);
				}
				break;
			case 'int':
				if (typeof value !== 'number') {
					throw new Meteor.Error('invalid-setting-value', `Setting ${ setting._id } is of type int but got ${ typeof value }`);
				}
				break;
			case 'multiSelect':
				if (!Array.isArray(value)) {
					throw new Meteor.Error('invalid-setting-value', `Setting ${ setting._id } is of type array but got ${ typeof value }`);
				}
				break;
			case 'select':

				if (typeof value !== 'string' && typeof value !== 'number') {
					throw new Meteor.Error('invalid-setting-value', `Setting ${ setting._id } is of type select but got ${ typeof value }`);
				}
				break;
			case 'date':
				if (!(value instanceof Date)) {
					throw new Meteor.Error('invalid-setting-value', `Setting ${ setting._id } is of type date but got ${ typeof value }`);
				}
				break;
			default:
				return true;
		}

		return true;
	}

	private _sorter: {[key: string]: number} = {};

	private initialLoad = true;

	constructor() {
		super();

		SettingsModel.find().forEach((record: ISetting) => {
			this.storeSettingValue(record, true);
			updateValue(record._id, { value: record.value });
		});
		this.initialLoad = false;
		SettingsEvents.emit('after-initial-load', Meteor.settings);
	}

	/*
	* Add a setting
	*/
	add(_id: string, value: SettingValue, { sorter, group, ...options }: ISettingAddOptions = {}): void {
		if (!_id || value == null) {
			throw new Error('Invalid arguments');
		}

		if (group) {
			this._sorter[group] = this._sorter[group] || -1;
			this._sorter[group]++;
		}

		const settingFromCode = getSettingDefaults({ _id, type: 'string', value, sorter, group, ...options });

		if (isSettingEnterprise(settingFromCode) && !('invalidValue' in settingFromCode)) {
			SystemLogger.error(`Enterprise setting ${ _id } is missing the invalidValue option`);
			throw new Error(`Enterprise setting ${ _id } is missing the invalidValue option`);
		}

		const settingStoredValue = Meteor.settings[_id] as ISetting['value'] | undefined;
		const settingOverwritten = overwriteSetting(settingFromCode);

		try {
			Settings.validate(settingFromCode, settingFromCode.value);
		} catch (e) {
			SystemLogger.error(`Invalid setting code ${ _id }: ${ e.message }`);
		}

		const isOverwritten = settingFromCode !== settingOverwritten;

		if (isOverwritten) {
			const { _id: _, ...settingProps } = settingOverwritten;
			settingStoredValue !== settingOverwritten.value && SettingsModel.upsert({ _id }, settingProps);
			return;
		}


		if (Meteor.settings.hasOwnProperty(_id)) {
			try {
				Settings.validate(settingFromCode, settingStoredValue);
			} catch (e) {
				SystemLogger.error(`Invalid setting stored ${ _id }: ${ e.message }`);
			}
			return;
		}

		const settingOverwrittenDefault = overrideSetting(settingFromCode);

		const setting = isOverwritten ? settingOverwritten : settingOverwrittenDefault;

		SettingsModel.insert(setting); // no need to emit unless we remove the oplog
	}

	/*
	* Add a setting group
	*/
	addGroup(_id: string, cb: addGroupCallback): void;

	// eslint-disable-next-line no-dupe-class-members
	addGroup(_id: string, grupOptions: ISettingAddGroupOptions | addGroupCallback = {}, cb?: addGroupCallback): void {
		if (!_id || (grupOptions instanceof Function && cb)) {
			throw new Error('Invalid arguments');
		}

		const callback = grupOptions instanceof Function ? grupOptions : cb;

		const options = grupOptions instanceof Function ? getGroupDefaults(_id) : getGroupDefaults(_id, grupOptions);

		const existentGroup = Meteor.settings[_id];
		if (existentGroup === undefined) {
			options.ts = new Date();
			SettingsModel.upsert({
				_id,
			}, {
				$set: options,
				$setOnInsert: {
					createdAt: new Date(),
				},
			});
		}

		if (!callback) {
			return;
		}

		const addWith = (preset: ISettingAddOptions) => (id: string, value: SettingValue, options: ISettingAddOptions = {}): void => {
			const mergedOptions = { ...preset, ...options };
			this.add(id, value, mergedOptions);
		};
		const sectionSetWith = (preset: ISettingAddOptions) => (options: ISettingAddOptions, cb: addSectionCallback): void => {
			const mergedOptions = { ...preset, ...options };
			cb.call({
				add: addWith(mergedOptions),
				with: sectionSetWith(mergedOptions),
			});
		};
		const sectionWith = (preset: ISettingAddOptions) => (section: string, cb: addSectionCallback): void => {
			const mergedOptions = { ...preset, section };
			cb.call({
				add: addWith(mergedOptions),
				with: sectionSetWith(mergedOptions),
			});
		};

		const groupSetWith = (preset: ISettingAddOptions) => (options: ISettingAddOptions, cb: addGroupCallback): void => {
			const mergedOptions = { ...preset, ...options };

			cb.call({
				add: addWith(mergedOptions),
				section: sectionWith(mergedOptions),
				with: groupSetWith(mergedOptions),
			});
		};

		return groupSetWith({ group: _id })({}, callback);
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
		SettingsEvents.emit('store-setting-value', [record, newData]);
		const { value } = newData;

		Meteor.settings[record._id] = record.type === 'group' ? true : value;
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

	onAfterInitialLoad(fn: (settings: Meteor.Settings) => void): void {
		if (this.initialLoad === false) {
			return fn(Meteor.settings);
		}
		SettingsEvents.once('after-initial-load', fn);
	}
}

export const settings = new Settings();
