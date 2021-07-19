import { Accordion, Box, Button, FieldGroup } from '@rocket.chat/fuselage';
import { useMutableCallback } from '@rocket.chat/fuselage-hooks';
import React, { useMemo } from 'react';

import {
	useEditableSettings,
	useEditableSettingsDispatch,
} from '../../../contexts/EditableSettingsContext';
import { useTranslation } from '../../../contexts/TranslationContext';
import SectionSkeleton from './SectionSkeleton';
import Setting from './Setting';

function Section({ children, groupId, hasReset = true, help, sectionName, solo }) {
	const editableSettings = useEditableSettings(
		useMemo(
			() => ({
				group: groupId,
				section: sectionName,
			}),
			[groupId, sectionName],
		),
	);

	const changed = useMemo(
		() => editableSettings.some(({ changed }) => changed),
		[editableSettings],
	);

	const canReset = useMemo(
		() =>
			editableSettings.some(
				({ value, packageValue }) => JSON.stringify(value) !== JSON.stringify(packageValue),
			),
		[editableSettings],
	);

	const dispatch = useEditableSettingsDispatch();

	const reset = useMutableCallback(() => {
		dispatch(
			editableSettings
				.filter(({ disabled }) => !disabled)
				.map(({ _id, value, packageValue, editor, packageEditor }) => ({
					_id,
					value: packageValue,
					editor: packageEditor,
					changed:
						JSON.stringify(value) !== JSON.stringify(packageValue) ||
						JSON.stringify(editor) !== JSON.stringify(packageEditor),
				})),
		);
	});

	const t = useTranslation();

	const handleResetSectionClick = () => {
		reset();
	};

	return (
		<Accordion.Item
			data-qa-section={sectionName}
			noncollapsible={solo || !sectionName}
			title={sectionName && t(sectionName)}
		>
			{help && (
				<Box is='p' color='hint' fontScale='p1'>
					{help}
				</Box>
			)}

			<FieldGroup>
				{editableSettings.map((setting) => (
					<Setting key={setting._id} settingId={setting._id} sectionChanged={changed} />
				))}

				{children}
			</FieldGroup>
			{hasReset && canReset && (
				<Button
					children={t('Reset_section_settings')}
					danger
					marginBlockStart={'x16'}
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
