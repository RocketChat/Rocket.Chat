import { Emitter } from '@rocket.chat/emitter';
import { Meteor } from 'meteor/meteor';

import { SettingsBase } from '../../lib/settings';
import SettingsModel from '../../../models/server/models/Settings';
import { updateValue } from '../raw';
import { ISetting, ISettingGroup, isSettingEnterprise, SettingValue } from '../../../../definition/ISetting';
import { SystemLogger } from '../../../../server/lib/logger/system';
import { overwriteSetting } from './overwriteSetting';
import { overrideSetting } from './overrideSetting';
import { getSettingDefaults } from './getSettingDefaults';
import { validateSetting } from './validateSetting';
import { SettingsVersion4 } from '../Settingsv4';

export { SettingsVersion4 };

export const blockedSettings = new Set<string>();
export const hiddenSettings = new Set<string>();
export const wizardRequiredSettings = new Set<string>();

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


const getGroupDefaults = (_id: string, options: ISettingAddGroupOptions = {}): ISettingGroup => ({
	_id,
	i18nLabel: _id,
	i18nDescription: `${ _id }_Description`,
	...options,
	sorter: options.sorter || 0,
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


type ISettingAddOptions = Partial<ISetting>;

class Settings extends SettingsBase {
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
		SettingsVersion4.setInitialized();
	}

	/*
	* Add a setting
	*/
	add(_id: string, value: SettingValue, { sorter, group, ...options }: ISettingAddOptions = {}): void {
		if (!_id || value == null) {
			throw new Error('Invalid arguments');
		}

		if (_id.startsWith('Accounts')) {
			console.log('1 ---> ', _id, value);
		}

		const sorterKey = group && options.section ? `${ group }_${ options.section }` : group;

		if (sorterKey) {
			this._sorter[sorterKey] = this._sorter[sorterKey] || -1;
			this._sorter[sorterKey]++;
		}

		const settingFromCode = getSettingDefaults({ _id, type: 'string', value, sorter: sorter ?? (sorterKey?.length && this._sorter[sorterKey]), group, ...options }, blockedSettings, hiddenSettings, wizardRequiredSettings);
		if (isSettingEnterprise(settingFromCode) && !('invalidValue' in settingFromCode)) {
			SystemLogger.error(`Enterprise setting ${ _id } is missing the invalidValue option`);
			throw new Error(`Enterprise setting ${ _id } is missing the invalidValue option`);
		}

		const settingStoredValue = Meteor.settings[_id] as ISetting['value'] | undefined;
		const settingOverwritten = overwriteSetting(settingFromCode);
		try {
			validateSetting(settingFromCode._id, settingFromCode.type, settingFromCode.value);
		} catch (e) {
			SystemLogger.error(`Invalid setting code ${ _id }: ${ e.message }`);
		}

		const isOverwritten = settingFromCode !== settingOverwritten;

		const { _id: _, ...settingProps } = settingOverwritten;
		if (isOverwritten) {
			if (settingStoredValue !== settingOverwritten.value) {
				SettingsModel.upsert({ _id }, settingProps);
			}
			return;
		}


		if (_id.startsWith('Accounts')) {
			console.log('2 ---> ', _id, value);
		}

		if (Meteor.settings.hasOwnProperty(_id)) {
			try {
				validateSetting(settingFromCode._id, settingFromCode.type, settingStoredValue);
			} catch (e) {
				SystemLogger.error(`Invalid setting stored ${ _id }: ${ e.message }`);
			}
			return;
		}

		const settingOverwrittenDefault = overrideSetting(settingFromCode);

		const setting = isOverwritten ? settingOverwritten : settingOverwrittenDefault;

		SettingsModel.insert(setting); // no need to emit unless we remove the oplog

		if (_id.startsWith('Accounts')) {
			console.log('3 ---> ', _id, value);
		}
	}

	/*
	* Add a setting group
	*/
	addGroup(_id: string, cb: addGroupCallback): void;

	// eslint-disable-next-line no-dupe-class-members
	addGroup(_id: string, groupOptions: ISettingAddGroupOptions | addGroupCallback = {}, cb?: addGroupCallback): void {
		if (!_id || (groupOptions instanceof Function && cb)) {
			throw new Error('Invalid arguments');
		}

		this._sorter[_id] = this._sorter[_id] || -1;
		this._sorter[_id]++;

		const callback = groupOptions instanceof Function ? groupOptions : cb;

		const options = groupOptions instanceof Function ? getGroupDefaults(_id, { sorter: this._sorter[_id] }) : getGroupDefaults(_id, { sorter: this._sorter[_id], ...groupOptions });

		if (!Meteor.settings.hasOwnProperty(_id)) {
			options.ts = new Date();
			SettingsModel.insert(options);
			this.storeSettingValue(options as ISetting, true);
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
		if (record._id.startsWith('Accounts')) {
			console.log('storeSettingValue ---> ', record._id, value);
		}
		Meteor.settings[record._id] = record.type === 'group' ? true : value;
		if (record.env === true) {
			process.env[record._id] = String(value);
		}

		this.load(record._id, Meteor.settings[record._id], initialLoad);
		SettingsVersion4.set(record._id, Meteor.settings[record._id]);
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
