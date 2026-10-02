import type { SettingEditor, SettingValue } from '@rocket.chat/core-typings';
import { isSettingColor, isSetting } from '@rocket.chat/core-typings';
import { useDebouncedCallback, useStableCallback } from '@rocket.chat/fuselage-hooks';
import { useSettingsDispatch, useSettingStructure } from '@rocket.chat/ui-contexts';
import DOMPurify from 'dompurify';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import MarkdownText from '../../../../components/MarkdownText';
import { useEditableSetting, useEditableSettingVisibilityQuery } from '../../EditableSettingsContext';
import MemoizedSetting from '../../settings/Setting/MemoizedSetting';
import { useHasSettingModule } from '../../settings/hooks/useHasSettingModule';
import { useSettingDraft } from '../../settings/hooks/useSettingDraft';

export type SettingFieldProps = {
	className?: string;
	settingId: string;
	sectionChanged?: boolean;
};

function SettingField({ className = undefined, settingId, sectionChanged }: SettingFieldProps) {
	const setting = useEditableSetting(settingId);
	const persistedSetting = useSettingStructure(settingId);
	const hasSettingModule = useHasSettingModule(setting);

	if (!setting || !persistedSetting) {
		throw new Error(`Setting ${settingId} not found`);
	}

	// Checks if setting has at least required fields before doing anything
	if (!isSetting(setting)) {
		throw new Error(`Setting ${settingId} is not valid`);
	}

	const dispatch = useSettingsDispatch();

	const persist = useDebouncedCallback(
		({ value, editor }: { value?: SettingValue; editor?: SettingEditor }) => {
			dispatch([
				{
					_id: settingId,
					...(value !== undefined && { value }),
					...(editor !== undefined && { editor }),
				},
			]);
		},
		230,
		[settingId, dispatch],
	);

	const { t, i18n } = useTranslation();

	const { value, editor, setValue, setEditor, reset } = useSettingDraft(settingId);

	const onChangeValue = useStableCallback((value: SettingValue) => {
		setValue(value);
		persist({ value });
	});

	const onChangeEditor = useStableCallback((editor: SettingEditor) => {
		setEditor(editor);
		persist({ editor });
	});

	const onResetButtonClick = useStableCallback(() => {
		persist(reset());
	});

	const { _id, readonly, type, packageValue, i18nLabel, i18nDescription, alert } = setting;

	const disabled = !useEditableSettingVisibilityQuery(persistedSetting.enableQuery);
	const invisible = !useEditableSettingVisibilityQuery(persistedSetting.displayQuery);

	const labelText = (i18n.exists(i18nLabel) && t(i18nLabel)) || (i18n.exists(_id) && t(_id)) || i18nLabel || _id;

	const hint = useMemo(
		() => (i18nDescription && i18n.exists(i18nDescription) ? <MarkdownText variant='inline' content={t(i18nDescription)} /> : undefined),
		[i18n, i18nDescription, t],
	);

	const callout = useMemo(
		() =>
			alert && <span dangerouslySetInnerHTML={{ __html: i18n.exists(alert) ? DOMPurify.sanitize(t(alert)) : DOMPurify.sanitize(alert) }} />,
		[alert, i18n, t],
	);

	const shouldDisableEnterprise = setting.enterprise && !hasSettingModule;

	const hasResetButton =
		!shouldDisableEnterprise &&
		!readonly &&
		type !== 'asset' &&
		((isSettingColor(setting) && JSON.stringify(setting.packageEditor) !== JSON.stringify(editor)) ||
			JSON.stringify(value) !== JSON.stringify(packageValue)) &&
		!disabled;

	// @todo: type check props based on setting type

	return (
		<MemoizedSetting
			className={className}
			label={labelText}
			hint={hint}
			callout={callout}
			sectionChanged={sectionChanged}
			{...setting}
			disabled={disabled || shouldDisableEnterprise}
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

export default SettingField;
