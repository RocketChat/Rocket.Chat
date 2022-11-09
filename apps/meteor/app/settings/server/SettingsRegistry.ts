import { Emitter } from '@rocket.chat/emitter';
import { isEqual } from 'underscore';
import type { ISetting, ISettingGroup, Optional, SettingValue } from '@rocket.chat/core-typings';
import { isSettingEnterprise } from '@rocket.chat/core-typings';
import type { ISettingsModel } from '@rocket.chat/model-typings';

import { SystemLogger } from '../../../server/lib/logger/system';
import { overwriteSetting } from './functions/overwriteSetting';
import { overrideSetting } from './functions/overrideSetting';
import { getSettingDefaults } from './functions/getSettingDefaults';
import { validateSetting } from './functions/validateSetting';
import type { ICachedSettings } from './CachedSettings';

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

const IS_DEVELOPMENT = process.env.NODE_ENV === 'development';

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
	i18nDescription: `${_id}_Description`,
	...options,
	sorter: options.sorter || 0,
	blocked: blockedSettings.has(_id),
	hidden: hiddenSettings.has(_id),
	type: 'group',
	...(options.displayQuery && { displayQuery: JSON.stringify(options.displayQuery) }),
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

const compareSettingsIgnoringKeys =
	(keys: Array<keyof ISetting>) =>
	(a: ISetting, b: ISetting): boolean =>
		[...new Set([...Object.keys(a), ...Object.keys(b)])]
			.filter((key) => !keys.includes(key as keyof ISetting))
			.every((key) => isEqual(a[key as keyof ISetting], b[key as keyof ISetting]));

const compareSettings = compareSettingsIgnoringKeys([
	'value',
	'ts',
	'createdAt',
	'valueSource',
	'packageValue',
	'processEnvValue',
	'_updatedAt',
]);

export class SettingsRegistry {
	private model: ISettingsModel;

	private store: ICachedSettings;

	private _sorter: { [key: string]: number } = {};

	constructor({ store, model }: { store: ICachedSettings; model: ISettingsModel }) {
		this.store = store;
		this.model = model;
	}

	/*
	 * Add a setting
	 */
	async add(_id: string, value: SettingValue, { sorter, section, group, ...options }: ISettingAddOptions = {}): Promise<void> {
		if (!_id || value == null) {
			throw new Error('Invalid arguments');
		}

		const sorterKey = group && section ? `${group}_${section}` : group;

		if (sorterKey && this._sorter[sorterKey] == null) {
			if (group && section) {
				const currentGroupValue = this._sorter[group] ?? 0;
				this._sorter[sorterKey] = currentGroupValue * 1000;
			}
		}

		if (sorterKey) {
			this._sorter[sorterKey] = this._sorter[sorterKey] ?? -1;
		}

		const settingFromCode = getSettingDefaults(
			{
				_id,
				type: 'string',
				value,
				sorter: sorter ?? (sorterKey?.length && this._sorter[sorterKey]++),
				group,
				section,
				...options,
			},
			blockedSettings,
			hiddenSettings,
			wizardRequiredSettings,
		);

		if (isSettingEnterprise(settingFromCode) && !('invalidValue' in settingFromCode)) {
			SystemLogger.error(`Enterprise setting ${_id} is missing the invalidValue option`);
			throw new Error(`Enterprise setting ${_id} is missing the invalidValue option`);
		}

		const settingFromCodeOverwritten = overwriteSetting(settingFromCode);

		const settingStored = this.store.getSetting(_id);
		const settingStoredOverwritten = settingStored && overwriteSetting(settingStored);

		try {
			validateSetting(settingFromCode._id, settingFromCode.type, settingFromCode.value);
		} catch (e) {
			IS_DEVELOPMENT && SystemLogger.error(`Invalid setting code ${_id}: ${(e as Error).message}`);
		}

		const isOverwritten = settingFromCode !== settingFromCodeOverwritten || (settingStored && settingStored !== settingStoredOverwritten);

		const { _id: _, ...settingProps } = settingFromCodeOverwritten;

		if (settingStored && !compareSettings(settingStored, settingFromCodeOverwritten)) {
			const { value: _value, ...settingOverwrittenProps } = settingFromCodeOverwritten;

			const overwrittenKeys = Object.keys(settingFromCodeOverwritten);
			const removedKeys = Object.keys(settingStored).filter((key) => !['_updatedAt'].includes(key) && !overwrittenKeys.includes(key));

			const updatedProps = (() => {
				return {
					...settingOverwrittenProps,
					...(settingStoredOverwritten &&
						settingStored.value !== settingStoredOverwritten.value && { value: settingStoredOverwritten.value }),
				};
			})();

			await this.saveUpdatedSetting(_id, updatedProps, removedKeys);
			return;
		}

		if (settingStored && isOverwritten) {
			if (settingStored.value !== settingFromCodeOverwritten.value) {
				const overwrittenKeys = Object.keys(settingFromCodeOverwritten);
				const removedKeys = Object.keys(settingStored).filter((key) => !['_updatedAt'].includes(key) && !overwrittenKeys.includes(key));

				await this.saveUpdatedSetting(_id, settingProps, removedKeys);
			}
			return;
		}

		if (settingStored) {
			try {
				validateSetting(settingFromCode._id, settingFromCode.type, settingStored?.value);
			} catch (e) {
				IS_DEVELOPMENT && SystemLogger.error(`Invalid setting stored ${_id}: ${(e as Error).message}`);
			}
			return;
		}

		const settingOverwrittenDefault = overrideSetting(settingFromCode);

		const setting = isOverwritten ? settingFromCodeOverwritten : settingOverwrittenDefault;

		await this.model.insertOne(setting); // no need to emit unless we remove the oplog

		this.store.set(setting);
	}

	/*
	 * Add a setting group
	 */
	async addGroup(_id: string, cb: addGroupCallback): Promise<void>;

	// eslint-disable-next-line no-dupe-class-members
	async addGroup(_id: string, groupOptions: ISettingAddGroupOptions | addGroupCallback = {}, cb?: addGroupCallback): Promise<void> {
		if (!_id || (groupOptions instanceof Function && cb)) {
			throw new Error('Invalid arguments');
		}

		const callback = groupOptions instanceof Function ? groupOptions : cb;

		const options =
			groupOptions instanceof Function
				? getGroupDefaults(_id, { sorter: this._sorter[_id] })
				: getGroupDefaults(_id, { sorter: this._sorter[_id], ...groupOptions });

		if (!this.store.has(_id)) {
			options.ts = new Date();
			await this.model.insertOne(options as ISetting);
			this.store.set(options as ISetting);
		}

		if (!callback) {
			return;
		}

		const addWith =
			(preset: ISettingAddOptions) =>
			(id: string, value: SettingValue, options: ISettingAddOptions = {}): void => {
				const mergedOptions = { ...preset, ...options };
				this.add(id, value, mergedOptions);
			};
		const sectionSetWith =
			(preset: ISettingAddOptions) =>
			(options: ISettingAddOptions, cb: addSectionCallback): void => {
				const mergedOptions = { ...preset, ...options };
				cb.call({
					add: addWith(mergedOptions),
					with: sectionSetWith(mergedOptions),
				});
			};
		const sectionWith =
			(preset: ISettingAddOptions) =>
			(section: string, cb: addSectionCallback): void => {
				const mergedOptions = { ...preset, section };
				cb.call({
					add: addWith(mergedOptions),
					with: sectionSetWith(mergedOptions),
				});
			};

		const groupSetWith =
			(preset: ISettingAddOptions) =>
			(options: ISettingAddOptions, cb: addGroupCallback): void => {
				const mergedOptions = { ...preset, ...options };

				cb.call({
					add: addWith(mergedOptions),
					section: sectionWith(mergedOptions),
					with: groupSetWith(mergedOptions),
				});
			};

		return groupSetWith({ group: _id })({}, callback);
	}

	private async saveUpdatedSetting(
		_id: string,
		settingProps: Omit<Optional<ISetting, 'value'>, '_id'>,
		removedKeys?: string[],
	): Promise<void> {
		await this.model.updateOne(
			{ _id },
			{
				$set: settingProps,
				...(removedKeys?.length && {
					$unset: removedKeys.reduce((unset, key) => ({ ...unset, [key]: 1 }), {}),
				}),
			},
			{ upsert: true },
		);
	}
}
