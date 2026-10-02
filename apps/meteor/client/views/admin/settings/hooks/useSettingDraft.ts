import type { SettingEditor, SettingValue } from '@rocket.chat/core-typings';
import { isSettingCode, isSettingColor } from '@rocket.chat/core-typings';
import { useStableCallback } from '@rocket.chat/fuselage-hooks';
import { useSettingStructure } from '@rocket.chat/ui-contexts';

import { getCodeSettingError } from '../../../../lib/utils/getCodeSettingError';
import { useEditableSetting, useEditableSettingsDispatch } from '../../EditableSettingsContext';

type SettingDraft = {
	value?: SettingValue;
	editor?: SettingEditor;
};

const isSame = (a: unknown, b: unknown) => JSON.stringify(a) === JSON.stringify(b);

/**
 * The edited (not yet saved) value and editor of a setting, kept in the editable settings store,
 * with setters that also flag whether the draft differs from the persisted setting or is invalid.
 */
export const useSettingDraft = (_id: string) => {
	const setting = useEditableSetting(_id);
	const persistedSetting = useSettingStructure(_id);
	const dispatch = useEditableSettingsDispatch();

	const value = setting?.value;
	const editor = setting && isSettingColor(setting) ? setting.editor : undefined;

	const write = useStableCallback((draft: SettingDraft) => {
		if (!persistedSetting) {
			return;
		}

		const next = { value, editor, ...draft };
		const settingCode = isSettingCode(persistedSetting) ? persistedSetting.code : undefined;

		dispatch([
			{
				_id,
				...draft,
				changed:
					!isSame(persistedSetting.value, next.value) ||
					(isSettingColor(persistedSetting) && !isSame(persistedSetting.editor, next.editor)),
				invalid: getCodeSettingError(settingCode, next.value) !== undefined,
			},
		]);
	});

	const setValue = useStableCallback((value: SettingValue) => write({ value }));

	const setEditor = useStableCallback((editor: SettingEditor) => write({ editor }));

	const reset = useStableCallback((): SettingDraft => {
		const draft: SettingDraft = {
			value: persistedSetting?.packageValue,
			...(persistedSetting && isSettingColor(persistedSetting) && { editor: persistedSetting.packageEditor }),
		};
		write(draft);
		return draft;
	});

	return { value, editor, setValue, setEditor, reset };
};
