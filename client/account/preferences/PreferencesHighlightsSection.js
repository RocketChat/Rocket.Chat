import React from 'react';
import { Accordion, Field, FieldGroup, TextAreaInput } from '@rocket.chat/fuselage';

import { useTranslation } from '../../contexts/TranslationContext';
import { useUserPreference } from '../../contexts/UserContext';
import { useForm } from '../../hooks/useForm';

const PreferencesHighlightsSection = ({ onChange, ...props }) => {
	const t = useTranslation();

	const userHighlights = useUserPreference('highlights')?.join(',\n') ?? '';

	const { values, handlers } = useForm({ highlights: userHighlights }, onChange);

	const { highlights } = values;

	const { handleHighlights } = handlers;

	return <Accordion.Item title={t('Highlights')} {...props}>
		<FieldGroup>
			<Field>
				<Field.Label>
					{t('Highlights_List')}
				</Field.Label>
				<Field.Row>
					<TextAreaInput rows={4} value={highlights} onChange={handleHighlights} />
				</Field.Row>
				<Field.Hint>
					{t('Highlights_How_To')}
				</Field.Hint>
			</Field>
		</FieldGroup>
	</Accordion.Item>;
};

export default PreferencesHighlightsSection;
