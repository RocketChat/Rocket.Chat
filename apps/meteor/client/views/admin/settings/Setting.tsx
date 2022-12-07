import type { ISettingColor, SettingEditor, SettingValue } from '@rocket.chat/core-typings';
import { isSettingColor } from '@rocket.chat/core-typings';
import { useDebouncedCallback } from '@rocket.chat/fuselage-hooks';
import { useSettingStructure, useTranslation, useAbsoluteUrl } from '@rocket.chat/ui-contexts';
import type { ReactElement } from 'react';
import React, { useEffect, useMemo, useState, useCallback } from 'react';

import MarkdownText from '../../../components/MarkdownText';
import { useEditableSetting, useEditableSettingsDispatch, useIsEnterprise } from '../EditableSettingsContext';
import MemoizedSetting from './MemoizedSetting';
import SettingSkeleton from './SettingSkeleton';

type SettingProps = {
	className?: string;
	settingId: string;
	sectionChanged?: boolean;
};

function Setting({ className = undefined, settingId, sectionChanged }: SettingProps): ReactElement {
	const setting = useEditableSetting(settingId);
	const persistedSetting = useSettingStructure(settingId);
	const isEnterprise = useIsEnterprise();

	if (!setting || !persistedSetting) {
		throw new Error(`Setting ${settingId} not found`);
	}

	const dispatch = useEditableSettingsDispatch();

	const update = useDebouncedCallback(
		({ value, editor }: { value?: SettingValue; editor?: SettingEditor }) => {
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
						(isSettingColor(persistedSetting) && JSON.stringify(persistedSetting.editor) !== JSON.stringify(editor)),
				},
			]);
		},
		230,
		[persistedSetting, dispatch],
	);

	const t = useTranslation();

	const [value, setValue] = useState(setting.value);
	const [editor, setEditor] = useState(isSettingColor(setting) ? setting.editor : undefined);

	useEffect(() => {
		setValue(setting.value);
	}, [setting.value]);

	useEffect(() => {
		setEditor(isSettingColor(setting) ? setting.editor : undefined);
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [(setting as ISettingColor).editor]);

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
		setEditor(isSettingColor(setting) ? setting.editor : undefined);
		update({
			value: persistedSetting.packageValue,
			...(isSettingColor(persistedSetting) && { editor: persistedSetting.packageEditor }),
		});
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [setting.value, (setting as ISettingColor).editor, update, persistedSetting]);

	const { _id, disabled, readonly, type, packageValue, i18nLabel, i18nDescription, alert, invisible } = setting;

	const label = (t.has(i18nLabel) && t(i18nLabel)) || (t.has(_id) && t(_id)) || i18nLabel || _id;

	const hint = useMemo(
		() => (t.has(i18nDescription) ? <MarkdownText variant='inline' preserveHtml content={t(i18nDescription)} /> : undefined),
		[i18nDescription, t],
	);
	const callout = useMemo(() => alert && <span dangerouslySetInnerHTML={{ __html: t.has(alert) ? t(alert) : alert }} />, [alert, t]);

	const shouldDisableEnterprise = setting.enterprise && !isEnterprise;

	const absoluteUrl = useAbsoluteUrl();
	const enterpriseCallout = useMemo(
		() =>
			shouldDisableEnterprise ? (
				<MarkdownText variant='inline' content={t('Only_available_on_Enterprise_learn_more__URL', { URL: absoluteUrl('/admin') })} />
			) : undefined,
		[shouldDisableEnterprise, t, absoluteUrl],
	);

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
			label={label || undefined}
			hint={hint}
			callout={callout}
			enterpriseCallout={enterpriseCallout}
			sectionChanged={sectionChanged}
			{...setting}
			disabled={setting.disabled || shouldDisableEnterprise}
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
