import { Accordion, Button, FieldGroup, Paragraph } from '@rocket.chat/fuselage';
import React from 'react';

import { useTranslation } from '../../providers/TranslationProvider';
import { useSection } from './SectionState';
import { Setting } from './Setting';
import { SettingState } from './SettingState';

export function Section({ children, hasReset = true, help, solo }) {
	const section = useSection();
	const t = useTranslation();

	const handleResetSectionClick = () => {
		section.reset();
	};

	return <Accordion.Item noncollapsible={solo || !section.name} title={section.name && t(section.name)}>
		{help && <Paragraph hintColor>{help}</Paragraph>}

		<FieldGroup>
			{section.settings.map((setting) => <SettingState key={setting} setting={setting}>
				<Setting />
			</SettingState>)}

			{hasReset && section.canReset && <Button
				children={t('Reset_section_settings')}
				className='reset-group'
				danger
				data-section={section.name}
				ghost
				onClick={handleResetSectionClick}
			/>}

			{children}
		</FieldGroup>
	</Accordion.Item>;
}
