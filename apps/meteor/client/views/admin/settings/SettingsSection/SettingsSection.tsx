import { isSetting, isSettingColor } from '@rocket.chat/core-typings';
import { Box, Button, FieldGroup } from '@rocket.chat/fuselage';
import { useStableCallback } from '@rocket.chat/fuselage-hooks';
import type { TranslationKey } from '@rocket.chat/ui-contexts';
import type { ReactNode } from 'react';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import { useEditableSettings, useEditableSettingsDispatch } from '../../EditableSettingsContext';
import Setting from '../Setting';
import { getSettingsSectionId } from '../getSettingsSectionId';

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

	const hasTitle = !solo && !!sectionName;

	return (
		<Box is='section' id={getSettingsSectionId(groupId, sectionName)} data-qa-section={sectionName} mbe={24}>
			{hasTitle && (
				<Box
					is='h4'
					mbe={8}
					mi={4}
					fontScale='c1'
					color='hint'
					style={{ textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 700 }}
				>
					{t(sectionName as TranslationKey)}
				</Box>
			)}
			<Box bg='light' borderWidth={1} borderStyle='solid' borderColor='light' borderRadius='x8' pi={24} pbs={20} pbe={20}>
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
		</Box>
	);
}

export default SettingsSection;
