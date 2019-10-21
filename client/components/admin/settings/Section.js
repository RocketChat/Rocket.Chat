import { Accordion, Button, Paragraph, Subtitle } from '@rocket.chat/fuselage';
import React from 'react';

import { useTranslation } from '../../providers/TranslationProvider';
import { useBulkActions } from './EditingState';
import { Field } from './Field';

export function Section({ children, hasReset = true, help, section, solo }) {
	const t = useTranslation();
	const { reset } = useBulkActions();

	const handleResetSectionClick = () => {
		reset(section);
	};

	if (solo || !section.name) {
		return <>
			{section.name && <Subtitle>{t(section.name)}</Subtitle>}

			{help && <Paragraph hintColor>{help}</Paragraph>}

			<div className='section-content border-component-color'>
				{section.fields.map((field) => <Field key={field._id} field={field} />)}

				{hasReset && <Button
					children={t('Reset_section_settings')}
					className='reset-group'
					danger
					data-section={section.name}
					ghost
					onClick={handleResetSectionClick}
				/>}

				{children}
			</div>
		</>;
	}

	return <Accordion.Item title={t(section.name)}>
		{help && <Paragraph hintColor>{help}</Paragraph>}

		<div className='section-content border-component-color'>
			{section.fields.map((field) => <Field key={field._id} field={field} />)}

			{hasReset && <Button
				children={t('Reset_section_settings')}
				className='reset-group'
				danger
				data-section={section.name}
				ghost
				onClick={handleResetSectionClick}
			/>}

			{children}
		</div>
	</Accordion.Item>;
}
