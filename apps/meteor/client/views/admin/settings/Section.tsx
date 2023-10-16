import { isSetting, isSettingColor } from '@rocket.chat/core-typings';
import { Accordion, Box, Button, FieldGroup } from '@rocket.chat/fuselage';
import { useMutableCallback } from '@rocket.chat/fuselage-hooks';
import type { TranslationKey } from '@rocket.chat/ui-contexts';
import { useTranslation } from '@rocket.chat/ui-contexts';
import type { ReactElement, ReactNode } from 'react';
import React, { useMemo } from 'react';

import { useEditableSettings, useEditableSettingsDispatch } from '../EditableSettingsContext';
import SectionSkeleton from './SectionSkeleton';
import Setting from './Setting';

type SectionProps = {
	groupId: string;
	hasReset?: boolean;
	sectionName: string;
	tabName?: string;
	solo: boolean;
	help?: ReactNode;
	children?: ReactNode;
};

function Section({ groupId, hasReset = true, sectionName, tabName = '', solo, help, children }: SectionProps): ReactElement {
	const editableSettings = useEditableSettings(
		useMemo(
			() => ({
				group: groupId,
				section: sectionName,
				tab: tabName,
			}),
			[groupId, sectionName, tabName],
		),
	);

	const changed = useMemo(() => editableSettings.some(({ changed }) => changed), [editableSettings]);

	const canReset = useMemo(
		() => editableSettings.some(({ value, packageValue }) => JSON.stringify(value) !== JSON.stringify(packageValue)),
		[editableSettings],
	);

	const dispatch = useEditableSettingsDispatch();

	const reset = useMutableCallback(() => {
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

	const t = useTranslation();

	const handleResetSectionClick = (): void => {
		reset();
	};

	return (
		<Accordion.Item
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
		</Accordion.Item>
	);
}

export default Object.assign(Section, {
	Skeleton: SectionSkeleton,
});
