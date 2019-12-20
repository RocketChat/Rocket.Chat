import { Accordion, Button, FieldGroup, Paragraph, Text } from '@rocket.chat/fuselage';
import React from 'react';

import { useTranslation } from '../../../contexts/TranslationContext';
import { Setting } from './Setting';
import { useSection } from './SettingsState';

export function Section({ children, groupId, hasReset = true, help, sectionName, solo }) {
	const section = useSection(groupId, sectionName);
	const t = useTranslation();

	const handleResetSectionClick = () => {
		section.reset();
	};

	return <Accordion.Item
		data-qa-section={sectionName}
		noncollapsible={solo || !section.name}
		title={section.name && t(section.name)}
	>
		{help && <Paragraph><Text hintColor>{help}</Text></Paragraph>}

		<FieldGroup>
			{section.settings.map((settingId) => <Setting key={settingId} settingId={settingId} />)}

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

Section.Skeleton = function Skeleton() {
	return <Accordion.Item
		noncollapsible
		title={<Text.Skeleton animated subtitle />}
	>
		<Paragraph.Skeleton animated />

		<FieldGroup>
			{Array.from({ length: 10 }).map((_, i) => <Setting.Skeleton key={i} />)}
		</FieldGroup>
	</Accordion.Item>;
};
