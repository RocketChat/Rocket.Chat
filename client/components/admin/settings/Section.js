import { Accordion, Button, FieldGroup, Paragraph } from '@rocket.chat/fuselage';
import React from 'react';

import { useTranslation } from '../../providers/TranslationProvider';
import { useBulkActions } from './SettingsState';
import { SettingField } from './SettingField';

export function Section({ children, hasReset = true, help, section, solo }) {
	const t = useTranslation();
	const { reset } = useBulkActions();

	const handleResetSectionClick = () => {
		reset(section);
	};

	const canReset = section.fields.some(({ value, packageValue }) => value !== packageValue);

	return <Accordion.Item noncollapsible={solo || !section.name} title={section.name && t(section.name)}>
		{help && <Paragraph hintColor>{help}</Paragraph>}

		<FieldGroup>
			{section.fields.map((field) => <SettingField key={field._id} field={field} />)}

			{hasReset && canReset && <Button
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
