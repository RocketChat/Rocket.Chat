import { isSetting, isSettingColor } from '@rocket.chat/core-typings';
import { Box, Button, FieldGroup } from '@rocket.chat/fuselage';
import { useStableCallback } from '@rocket.chat/fuselage-hooks';
import type { TranslationKey } from '@rocket.chat/ui-contexts';
import type { ReactNode } from 'react';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import { useEditableSettings, useEditableSettingsDispatch } from '../../EditableSettingsContext';
import Setting from '../Setting';
import { getSectionAnchorId } from '../lib/sectionAnchor';

export type SettingsSectionProps = {
	groupId: string;
	hasReset?: boolean;
	sectionName: string;
	currentTab?: string;
	solo: boolean;
	help?: ReactNode;
	children?: ReactNode;
};

function SettingsSection({ groupId, hasReset = true, sectionName, currentTab, solo, help, children }: SettingsSectionProps) {
	const { t } = useTranslation();

	const editableSettings = useEditableSettings(
		useMemo(
			() => ({
				group: groupId,
				section: sectionName,
				tab: currentTab,
			}),
			[groupId, sectionName, currentTab],
		),
	);

	const changed = useMemo(() => editableSettings.some(({ changed }) => changed), [editableSettings]);

	const canReset = useMemo(
		() => editableSettings.some(({ value, packageValue }) => JSON.stringify(value) !== JSON.stringify(packageValue)),
		[editableSettings],
	);

	const dispatch = useEditableSettingsDispatch();

	const reset = useStableCallback(() => {
		dispatch(
			editableSettings
				.filter(({ disabled }) => !disabled)
				.map((setting) => {
					if (isSettingColor(setting)) {
						return {
							_id: setting._id,
							value: setting.packageValue,
							editor: setting.packageEditor,
							changed:
								JSON.stringify(setting.value) !== JSON.stringify(setting.packageValue) ||
								JSON.stringify(setting.editor) !== JSON.stringify(setting.packageEditor),
						};
					}
					return {
						_id: setting._id,
						value: setting.packageValue,
						changed: JSON.stringify(setting.value) !== JSON.stringify(setting.packageValue),
					};
				}),
		);
	});

	const handleResetSectionClick = (): void => {
		reset();
	};

	return (
		<Box
			is='section'
			id={getSectionAnchorId(groupId, sectionName)}
			data-qa-section={sectionName}
			mbe={24}
			p={24}
			borderWidth={1}
			borderStyle='solid'
			borderColor='extra-light'
			borderRadius={8}
			backgroundColor='surface-tint'
		>
			{sectionName && !solo && (
				<Box is='h3' fontScale='h4' mbe={help ? 4 : 16}>
					{t(sectionName as TranslationKey)}
				</Box>
			)}
			{help && (
				<Box is='p' color='hint' fontScale='p2' mbe={16}>
					{help}
				</Box>
			)}
			<FieldGroup>
				{editableSettings.map(
					(setting) => isSetting(setting) && <Setting key={setting._id} settingId={setting._id} sectionChanged={changed} />,
				)}

				{children}
			</FieldGroup>
			{hasReset && canReset && (
				<Button secondary danger marginBlockStart={16} data-section={sectionName} onClick={handleResetSectionClick}>
					{t('Reset_section_settings')}
				</Button>
			)}
		</Box>
	);
}

export default SettingsSection;
