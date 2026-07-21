import { isSetting, isSettingColor } from '@rocket.chat/core-typings';
import { Box, Button, FieldGroup } from '@rocket.chat/fuselage';
import { useStableCallback } from '@rocket.chat/fuselage-hooks';
import type { TranslationKey } from '@rocket.chat/ui-contexts';
import type { ReactNode } from 'react';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import type { EditableSetting } from '../../EditableSettingsContext';
import { useEditableSettings, useEditableSettingsDispatch } from '../../EditableSettingsContext';
import Setting from '../Setting';

export type SettingsSectionProps = {
	groupId: string;
	hasReset?: boolean;
	sectionName: string;
	sectionTitle?: string;
	currentTab?: string;
	solo: boolean;
	help?: ReactNode;
	children?: ReactNode;
};

function SettingsSection({ groupId, hasReset = true, sectionTitle, sectionName, currentTab, help, children }: SettingsSectionProps) {
	const { t, i18n } = useTranslation();

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

	// Group consecutive settings sharing the same `subsection` so each block can
	// be rendered as a captioned card; settings without a subsection keep the
	// plain layout.
	const subsectionGroups = useMemo(() => {
		const groups: { subsection: string; settings: EditableSetting[] }[] = [];
		for (const setting of editableSettings) {
			const subsection = setting.subsection ?? '';
			const lastGroup = groups[groups.length - 1];
			if (lastGroup?.subsection === subsection) {
				lastGroup.settings.push(setting);
			} else {
				groups.push({ subsection, settings: [setting] });
			}
		}
		return groups;
	}, [editableSettings]);

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

	const sectionDescriptionKey = sectionName && `${sectionName}_Description`;
	const sectionDescription =
		sectionDescriptionKey && i18n.exists(sectionDescriptionKey) ? t(sectionDescriptionKey as TranslationKey) : undefined;

	const title = sectionTitle || (sectionName && t(sectionName as TranslationKey));

	return (
		<Box is='section' data-qa-section={sectionName} marginBlockEnd={48}>
			{title && (
				<Box is='h2' fontScale='h3' color='titles-labels' marginBlockEnd={4}>
					{title}
				</Box>
			)}
			{sectionDescription && (
				<Box is='p' color='hint' fontScale='p2' marginBlockEnd={16}>
					{sectionDescription}
				</Box>
			)}
			{help && (
				<Box is='p' color='hint' fontScale='p2'>
					{help}
				</Box>
			)}
			{subsectionGroups.map(({ subsection, settings }, index) => (
				<Box key={subsection || `ungrouped-${index}`} marginBlockEnd={24}>
					{subsection && (
						<Box fontScale='micro' textTransform='uppercase' color='hint' marginBlockEnd={8}>
							{i18n.exists(subsection) ? t(subsection as TranslationKey) : subsection}
						</Box>
					)}
					<Box backgroundColor='light' borderRadius='x8' padding={20}>
						<FieldGroup>
							{settings.map(
								(setting) => isSetting(setting) && <Setting key={setting._id} settingId={setting._id} sectionChanged={changed} />,
							)}
						</FieldGroup>
					</Box>
				</Box>
			))}
			{children && <FieldGroup>{children}</FieldGroup>}
			{hasReset && canReset && (
				<Button secondary danger marginBlockStart={16} data-section={sectionName} onClick={handleResetSectionClick}>
					{t('Reset_section_settings')}
				</Button>
			)}
		</Box>
	);
}

export default SettingsSection;
