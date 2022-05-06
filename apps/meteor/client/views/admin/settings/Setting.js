import { useDebouncedCallback } from '@rocket.chat/fuselage-hooks';
import { useSettingStructure, useTranslation } from '@rocket.chat/ui-contexts';
import React, { useEffect, useMemo, useState, useCallback } from 'react';

import MarkdownText from '../../../components/MarkdownText';
import { useEditableSetting, useEditableSettingsDispatch } from '../EditableSettingsContext';
import MemoizedSetting from './MemoizedSetting';
import SettingSkeleton from './SettingSkeleton';

function Setting({ className, settingId, sectionChanged }) {
	const setting = useEditableSetting(settingId);

	const persistedSetting = useSettingStructure(settingId);
	const dispatch = useEditableSettingsDispatch();

	const update = useDebouncedCallback(
		({ value, editor }) => {
			if (!persistedSetting) {
				return;
			}

			dispatch([
				{
					_id: persistedSetting._id,
					...(value !== undefined && { value }),
					...(editor !== undefined && { editor }),
					changed:
						JSON.stringify(persistedSetting.value) !== JSON.stringify(value) ||
						JSON.stringify(persistedSetting.editor) !== JSON.stringify(editor),
				},
			]);
		},
		230,
		[persistedSetting, dispatch],
	);

	const t = useTranslation();

	const [value, setValue] = useState(setting.value);
	const [editor, setEditor] = useState(setting.editor);

	useEffect(() => {
		setValue(setting.value);
	}, [setting.value]);

	useEffect(() => {
		setEditor(setting.editor);
	}, [setting.editor]);

	const onChangeValue = useCallback(
		(value) => {
			setValue(value);
			update({ value });
		},
		[update],
	);

	const onChangeEditor = useCallback(
		(editor) => {
			setEditor(editor);
			update({ editor });
		},
		[update],
	);

	const onResetButtonClick = useCallback(() => {
		setValue(setting.value);
		setEditor(setting.editor);
		update({
			value: persistedSetting.packageValue,
			editor: persistedSetting.packageEditor,
		});
	}, [setting.value, setting.editor, update, persistedSetting]);

	const { _id, disabled, disableReset, readonly, type, packageEditor, packageValue, i18nLabel, i18nDescription, alert, invisible } =
		setting;

	const label = (i18nLabel && t(i18nLabel)) || _id || t(_id);
	const hint = useMemo(
		() => t.has(i18nDescription) && <MarkdownText preserveHtml={true} content={t(i18nDescription)} />,
		[i18nDescription, t],
	);
	const callout = useMemo(() => alert && <span dangerouslySetInnerHTML={{ __html: t(alert) }} />, [alert, t]);
	const hasResetButton =
		!disableReset &&
		!readonly &&
		type !== 'asset' &&
		(JSON.stringify(packageEditor) !== JSON.stringify(editor) || JSON.stringify(value) !== JSON.stringify(packageValue)) &&
		!disabled;

	return (
		<MemoizedSetting
			className={className}
			type={type}
			label={label}
			hint={hint}
			callout={callout}
			sectionChanged={sectionChanged}
			{...setting}
			value={value}
			editor={editor}
			hasResetButton={hasResetButton}
			onChangeValue={onChangeValue}
			onChangeEditor={onChangeEditor}
			onResetButtonClick={onResetButtonClick}
			invisible={invisible}
		/>
	);
}

export default Object.assign(Setting, {
	Memoized: MemoizedSetting,
	Skeleton: SettingSkeleton,
});
