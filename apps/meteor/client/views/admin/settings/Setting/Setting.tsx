import { isSettingColor, isSetting } from '@rocket.chat/core-typings';
import { Box, Button, Tag } from '@rocket.chat/fuselage';
import { useSettingStructure } from '@rocket.chat/ui-contexts';
import { useMemo } from 'react';
import { Trans, useTranslation } from 'react-i18next';

import MemoizedSetting from './MemoizedSetting';
import MarkdownText from '../../../../components/MarkdownText';
import { links } from '../../../../lib/links';
import { useEditableSetting, useEditableSettingVisibilityQuery } from '../../EditableSettingsContext';
import { useHasSettingModule } from '../hooks/useHasSettingModule';
import { useSettingDraft } from '../hooks/useSettingDraft';

const PRICING_URL = links.go.pricing;

export type SettingProps = {
	className?: string;
	settingId: string;
	sectionChanged?: boolean;
};

function Setting({ className = undefined, settingId, sectionChanged }: SettingProps) {
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

	const { t, i18n } = useTranslation();

	const { value, editor, setValue: onChangeValue, setEditor: onChangeEditor, reset: onResetButtonClick } = useSettingDraft(settingId);

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
			alert && (
				<Trans
					i18nKey={i18n.exists(alert) ? alert : undefined}
					defaults={alert}
					components={{
						b: <b />,
						strong: <strong />,
						br: <br />,
						ul: <ul />,
						li: <li />,
					}}
				/>
			),
		[alert, i18n],
	);

	const shouldDisableEnterprise = setting.enterprise && !hasSettingModule;

	const showUpgradeButton = useMemo(
		() =>
			shouldDisableEnterprise ? (
				<Button marginBlockStart={4} is='a' href={PRICING_URL} target='_blank'>
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
				<Box is='span' marginInlineEnd={4}>
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

export default Setting;
