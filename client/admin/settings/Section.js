import { Accordion, Box, Button, FieldGroup, Skeleton } from '@rocket.chat/fuselage';
import React from 'react';

import { useTranslation } from '../../contexts/TranslationContext';
import { Setting } from './Setting';
import { useSection, useSectionChangedState } from './SettingsState';

export function Section({ children, groupId, hasReset = true, help, sectionName, solo }) {
	const section = useSection(groupId, sectionName);
	const changed = useSectionChangedState(groupId, sectionName);

	const t = useTranslation();

	const handleResetSectionClick = () => {
		section.reset();
	};

	return <Accordion.Item
		data-qa-section={sectionName}
		noncollapsible={solo || !section.name}
		title={section.name && t(section.name)}
	>
		{help && <Box is='p' color='hint' fontScale='p1'>{help}</Box>}

		<FieldGroup>
			{section.settings.map((settingId) => <Setting key={settingId} settingId={settingId} sectionChanged={changed} />)}

			{hasReset && section.canReset && <Button
				children={t('Reset_section_settings')}
				danger
				data-section={section.name}
				ghost
				onClick={handleResetSectionClick}
			/>}

			{children}
		</FieldGroup>
	</Accordion.Item>;
}

export function SectionSkeleton() {
	return <Accordion.Item noncollapsible title={<Skeleton />}>
		<Box is='p' color='hint' fontScale='p1'>
			<Skeleton />
		</Box>

		<FieldGroup>
			{Array.from({ length: 10 }).map((_, i) => <Setting.Skeleton key={i} />)}
		</FieldGroup>
	</Accordion.Item>;
}

Section.Skeleton = SectionSkeleton;
