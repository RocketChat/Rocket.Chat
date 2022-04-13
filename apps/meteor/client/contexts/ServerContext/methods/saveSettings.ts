import type { ISetting } from '@rocket.chat/core-typings';

type SettingChange = {
	_id: ISetting['_id'];
	value: unknown;
	editor?: unknown;
};

export type SaveSettingsMethod = (changes: SettingChange[]) => true;
