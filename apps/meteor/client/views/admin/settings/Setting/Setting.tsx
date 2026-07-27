import type { ISettingColor, SettingEditor, SettingValue } from '@rocket.chat/core-typings';
import { isSettingColor, isSetting, isSettingCode } from '@rocket.chat/core-typings';
import { Box, Tag } from '@rocket.chat/fuselage';
import { useDebouncedCallback } from '@rocket.chat/fuselage-hooks';
import { useSettingStructure } from '@rocket.chat/ui-contexts';
import { useEffect, useMemo, useState, useCallback } from 'react';
import { Trans, useTranslation } from 'react-i18next';

import MemoizedSetting from './MemoizedSetting';
import MarkdownText from '../../../../components/MarkdownText';
import { getCodeSettingError } from '../../../../lib/utils/getCodeSettingError';
import { useEditableSetting, useEditableSettingsDispatch, useEditableSettingVisibilityQuery } from '../../EditableSettingsContext';
import { useHasSettingModule } from '../hooks/useHasSettingModule';

const PLANS_URL = 'https://www.rocket.chat/plans';

export type SettingProps = {
	className?: string;
	settingId: string;
	sectionChanged?: boolean;
	/** how a premium-locked setting advertises the upgrade: an inline link (default) or nothing
	 * (when the surrounding block already renders a premium callout) */
	premiumCta?: 'link' | 'none';
};

function Setting({ className = undefined, settingId, sectionChanged, premiumCta = 'link' }: SettingProps) {
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

	const settingCode = isSettingCode(persistedSetting) ? persistedSetting.code : undefined;

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
					...(value !== undefined && { invalid: getCodeSettingError(settingCode, value) !== undefined }),
				},
			]);
		},
		230,
		[persistedSetting, dispatch, settingCode],
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
			if (settingCode !== undefined) {
				dispatch([{ _id: persistedSetting._id, invalid: getCodeSettingError(settingCode, value) !== undefined }]);
			}
			update({ value });
		},
		[update, dispatch, settingCode, persistedSetting._id],
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

	const label = labelText;

	const hasResetButton =
		!shouldDisableEnterprise &&
		!readonly &&
		type !== 'asset' &&
		((isSettingColor(setting) && JSON.stringify(setting.packageEditor) !== JSON.stringify(editor)) ||
			JSON.stringify(value) !== JSON.stringify(packageValue)) &&
		!disabled;

	// @todo: type check props based on setting type

	// every isolated premium setting carries its own tag row above the field; the
	// upgrade link only shows while the license does not cover it (blocks that are
	// fully premium advertise once at the block level instead — premiumCta 'none').
	// rendered inside the Field so the FieldGroup sibling spacing stays intact
	const premiumRow =
		setting.enterprise && premiumCta === 'link' ? (
			<Box display='flex' alignItems='center' style={{ gap: '0.5rem' }}>
				<Tag variant='featured'>{t('Premium')}</Tag>
				{shouldDisableEnterprise && (
					<Box
						is='a'
						href={PLANS_URL}
						target='_blank'
						rel='noopener noreferrer'
						fontScale='c1'
						color='info'
						textDecorationLine='underline'
					>
						{t('Upgrade_to_unlock')}
					</Box>
				)}
			</Box>
		) : undefined;

	return (
		<MemoizedSetting
			className={className}
			label={label}
			hint={hint}
			callout={callout}
			premiumRow={premiumRow}
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
