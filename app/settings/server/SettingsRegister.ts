import { Emitter } from '@rocket.chat/emitter';

import SettingsModel from '../../models/server/models/Settings';
import { ISetting, ISettingGroup, isSettingEnterprise, SettingValue } from '../../../definition/ISetting';
import { SystemLogger } from '../../../server/lib/logger/system';
import { overwriteSetting } from './functions/overwriteSetting';
import { overrideSetting } from './functions/overrideSetting';
import { getSettingDefaults } from './functions/getSettingDefaults';
import { validateSetting } from './functions/validateSetting';
import type { ICachedSettings } from './Settingsv4';

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

/*
* @deprecated
* please do not use event emitter to mutate values
*/
export const SettingsEvents = new Emitter<{
	'store-setting-value': [ISetting, { value: SettingValue }];
	'fetch-settings': ISetting[];
	'remove-setting-value': ISetting;
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

export class SettingsRegister {
	private store: ICachedSettings;

	private _sorter: {[key: string]: number} = {};

	constructor(store: ICachedSettings) {
		this.store = store;
	}

	/*
	* Add a setting
	*/
	add(_id: string, value: SettingValue, { sorter, section, group, ...options }: ISettingAddOptions = {}): void {
		if (!_id || value == null) {
			throw new Error('Invalid arguments');
		}

		const sorterKey = group && section ? `${ group }_${ section }` : group;

		if (sorterKey) {
			this._sorter[sorterKey] = this._sorter[sorterKey] ?? -1;
			this._sorter[sorterKey]++;
		}

		const settingFromCode = getSettingDefaults({ _id, type: 'string', section, value, sorter: sorter ?? (sorterKey?.length && this._sorter[sorterKey]), group, ...options }, blockedSettings, hiddenSettings, wizardRequiredSettings);

		if (isSettingEnterprise(settingFromCode) && !('invalidValue' in settingFromCode)) {
			SystemLogger.error(`Enterprise setting ${ _id } is missing the invalidValue option`);
			throw new Error(`Enterprise setting ${ _id } is missing the invalidValue option`);
		}

		const settingStoredValue = this.store.has(_id) ? this.store.get(_id) : undefined;
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

		if (this.store.has(_id)) {
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

		this.store.set(setting);
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

		if (!this.store.has(_id)) {
			options.ts = new Date();
			SettingsModel.insert(options);
			this.store.set(options as ISetting);
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
}
