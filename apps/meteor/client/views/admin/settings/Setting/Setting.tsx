import type { ISettingColor, SettingEditor, SettingValue } from '@rocket.chat/core-typings';
import { isSettingColor, isSetting } from '@rocket.chat/core-typings';
import { Box, Button, Tag } from '@rocket.chat/fuselage';
import { useDebouncedCallback } from '@rocket.chat/fuselage-hooks';
import { useSettingStructure } from '@rocket.chat/ui-contexts';
import DOMPurify from 'dompurify';
import type { ReactElement } from 'react';
import { useEffect, useMemo, useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';

import MemoizedSetting from './MemoizedSetting';
import MarkdownText from '../../../../components/MarkdownText';
import { useEditableSetting, useEditableSettingsDispatch } from '../../EditableSettingsContext';
import { useHasSettingModule } from '../hooks/useHasSettingModule';

type SettingProps = {
	className?: string;
	settingId: string;
	sectionChanged?: boolean;
};

function Setting({ className = undefined, settingId, sectionChanged }: SettingProps): ReactElement {
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

	const { t, i18n } = useTranslation();

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
		(value: SettingValue) => {
			setValue(value);
			update({ value });
		},
		[update],
	);

	const onChangeEditor = useCallback(
		(editor: SettingEditor) => {
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

	const labelText = (i18n.exists(i18nLabel) && t(i18nLabel)) || (i18n.exists(_id) && t(_id)) || i18nLabel || _id;

	const hint = useMemo(
		() =>
			i18nDescription && i18n.exists(i18nDescription) ? (
				<MarkdownText variant='inline' preserveHtml content={t(i18nDescription)} />
			) : undefined,
		[i18n, i18nDescription, t],
	);

	const callout = useMemo(
		() =>
			alert && <span dangerouslySetInnerHTML={{ __html: i18n.exists(alert) ? DOMPurify.sanitize(t(alert)) : DOMPurify.sanitize(alert) }} />,
		[alert, i18n, t],
	);

	const shouldDisableEnterprise = setting.enterprise && !hasSettingModule;

	const PRICING_URL = 'https://go.rocket.chat/i/see-paid-plan-customize-homepage';

	const showUpgradeButton = useMemo(
		() =>
			shouldDisableEnterprise ? (
				<Button mbs={4} is='a' href={PRICING_URL} target='_blank'>
					{t('See_Paid_Plan')}
				</Button>
			) : undefined,
		[shouldDisableEnterprise, t],
	);

	const label = useMemo(() => {
		if (!shouldDisableEnterprise) {
			return labelText;
		}

		return (
			<>
				<Box is='span' mie={4}>
					{labelText}
				</Box>
				<Tag variant='featured'>{t('Premium')}</Tag>
			</>
		);
	}, [labelText, shouldDisableEnterprise, t]);

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
			label={label}
			hint={hint}
			callout={callout}
			showUpgradeButton={showUpgradeButton}
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

export default Setting;
