import { ISetting } from '../../../../definition/ISetting';

type SettingChange = {
	_id: ISetting['_id'];
	value: unknown;
	editor?: unknown;
};

export type SaveSettingsMethod = (changes: SettingChange[]) => true;
