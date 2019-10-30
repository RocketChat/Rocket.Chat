import { Accordion, Button, FieldGroup, Paragraph } from '@rocket.chat/fuselage';
import React from 'react';

import { useTranslation } from '../../providers/TranslationProvider';
import { useSection } from './SectionState';
import { SettingField } from './SettingField';
import { useSettingsState } from './SettingsState';

export function Section({ children, hasReset = true, help, solo }) {
	const section = useSection();
	const t = useTranslation();
	const { state } = useSettingsState();
	const settings = state.filter(({ _id }) => section.settings.includes(_id));

	const handleResetSectionClick = () => {
		section.reset();
	};

	return <Accordion.Item noncollapsible={solo || !section.name} title={section.name && t(section.name)}>
		{help && <Paragraph hintColor>{help}</Paragraph>}

		<FieldGroup>
			{settings.map((setting) => <SettingField key={setting._id} field={setting} />)}

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
