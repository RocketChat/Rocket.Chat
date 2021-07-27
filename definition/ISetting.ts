import { FilterQuery } from 'mongodb';

export type SettingId = string;
export type GroupId = SettingId;
export type SectionName = string;

export enum SettingEditor {
	COLOR = 'color',
	EXPRESSION = 'expression'
}

export type SettingValueMultiSelect = string[];
export type SettingValueRoomPick = Array<{_id: string; name: string}> | string;
export type SettingValue = string | boolean | number | SettingValueMultiSelect | undefined;

export interface ISettingSelectOption {
	key: string;
	i18nLabel: string;
}

export interface ISetting {
	_id: SettingId;
	type: 'boolean' | 'string' | 'relativeUrl' | 'password' | 'int' | 'select' | 'multiSelect' | 'language' | 'color' | 'font' | 'code' | 'action' | 'asset' | 'roomPick' | 'group' | 'date';
	public: boolean;
	env: boolean;
	group?: GroupId;
	section?: SectionName;
	i18nLabel: string;
	value: SettingValue;
	packageValue: SettingValue;
	editor?: SettingEditor;
	packageEditor?: SettingEditor;
	blocked: boolean;
	enableQuery?: string | FilterQuery<ISetting> | FilterQuery<ISetting>[];
	sorter?: number;
	properties?: unknown;
	enterprise?: boolean;
	requiredOnWizard?: boolean;
	hidden?: boolean;
	modules?: Array<string>;
	invalidValue?: SettingValue;
	valueSource?: string;
	secret?: boolean;
	i18nDescription?: string;
	autocomplete?: boolean;
	processEnvValue?: SettingValue;
	meteorSettingsValue?: SettingValue;
	ts?: Date;
	multiline?: boolean;
	values?: Array<ISettingSelectOption>;
}
