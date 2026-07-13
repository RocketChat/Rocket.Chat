import { isSetting, isSettingColor } from '@rocket.chat/core-typings';
import { Box, Button, FieldGroup } from '@rocket.chat/fuselage';
import { useStableCallback } from '@rocket.chat/fuselage-hooks';
import type { TranslationKey } from '@rocket.chat/ui-contexts';
import type { ReactNode } from 'react';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import { useEditableSettings, useEditableSettingsDispatch } from '../../EditableSettingsContext';
import Setting from '../Setting';

export type SettingsSectionProps = {
	groupId: string;
	hasReset?: boolean;
	sectionName: string;
	currentTab?: string;
	id?: string;
	help?: ReactNode;
	children?: ReactNode;
};

function SettingsSection({ groupId, hasReset = true, sectionName, currentTab, id, help, children }: SettingsSectionProps) {
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
		<Box is='section' data-qa-section={sectionName} id={id} mbe={24}>
			{sectionName && (
				<Box is='h2' fontScale='h4' mbe={12}>
					{t(sectionName as TranslationKey)}
				</Box>
			)}
			<Box
				p={24}
				borderWidth='default'
				borderColor='light'
				borderRadius='x8'
				backgroundColor='surface-light'
				display='flex'
				flexDirection='column'
			>
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
					<Button
						secondary
						danger
						marginBlockStart={16}
						alignSelf='flex-start'
						data-section={sectionName}
						onClick={handleResetSectionClick}
					>
						{t('Reset_section_settings')}
					</Button>
				)}
			</Box>
		</Box>
	);
}

export default SettingsSection;
