import { Accordion, Button, FieldGroup, Paragraph } from '@rocket.chat/fuselage';
import React from 'react';
import styled from 'styled-components';

import { useTranslation } from '../../providers/TranslationProvider';
import { useBulkActions } from './EditingState';
import { SettingField } from './SettingField';

const Wrapper = styled.div`
	max-width: 543px;
`;

export function Section({ children, hasReset = true, help, section, solo }) {
	const t = useTranslation();
	const { reset } = useBulkActions();

	const handleResetSectionClick = () => {
		reset(section);
	};

	return <Accordion.Item noncollapsible={solo || !section.name} title={section.name && t(section.name)}>
		<Wrapper>
			{help && <Paragraph hintColor>{help}</Paragraph>}

			<FieldGroup>
				{section.fields.map((field) => <SettingField key={field._id} field={field} />)}

				{hasReset && section.changed && <Button
					children={t('Reset_section_settings')}
					className='reset-group'
					danger
					data-section={section.name}
					ghost
					onClick={handleResetSectionClick}
				/>}

				{children}
			</FieldGroup>
		</Wrapper>
	</Accordion.Item>;
}
