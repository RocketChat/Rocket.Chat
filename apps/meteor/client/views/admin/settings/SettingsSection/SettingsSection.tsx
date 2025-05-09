import { isSetting, isSettingColor } from '@rocket.chat/core-typings';
import { AccordionItem, Box, Button, FieldGroup } from '@rocket.chat/fuselage';
import { useEffectEvent } from '@rocket.chat/fuselage-hooks';
import type { TranslationKey } from '@rocket.chat/ui-contexts';
import type { ReactElement, ReactNode } from 'react';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import { useEditableSettings, useEditableSettingsDispatch } from '../../EditableSettingsContext';
import Setting from '../Setting';

type SettingsSectionProps = {
	groupId: string;
	hasReset?: boolean;
	sectionName: string;
	currentTab?: string;
	solo: boolean;
	help?: ReactNode;
	children?: ReactNode;
};

function SettingsSection({ groupId, hasReset = true, sectionName, currentTab, solo, help, children }: SettingsSectionProps): ReactElement {
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

	const reset = useEffectEvent(() => {
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
		<AccordionItem
			data-qa-section={sectionName}
			noncollapsible={solo || !sectionName}
			title={sectionName && t(sectionName as TranslationKey)}
		>
			{help && (
				<Box is='p' color='hint' fontScale='p2'>
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
					children={t('Reset_section_settings')}
					secondary
					danger
					marginBlockStart={16}
					data-section={sectionName}
					onClick={handleResetSectionClick}
				/>
			)}
		</AccordionItem>
	);
}

export default SettingsSection;
