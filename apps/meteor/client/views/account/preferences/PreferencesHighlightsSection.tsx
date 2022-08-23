import { Accordion, Field, FieldGroup, TextAreaInput } from '@rocket.chat/fuselage';
import { useUserPreference, useTranslation } from '@rocket.chat/ui-contexts';
import React, { ReactElement } from 'react';

import { useForm } from '../../../hooks/useForm';
import { FormSectionProps } from './AccountPreferencesPage';

const PreferencesHighlightsSection = ({ onChange, commitRef, ...props }: FormSectionProps): ReactElement => {
	const t = useTranslation();

	const userHighlights = useUserPreference<string[]>('highlights')?.join(',\n') ?? '';

	const { values, handlers, commit } = useForm({ highlights: userHighlights }, onChange);

	const { highlights } = values as { highlights: string };

	const { handleHighlights } = handlers;

	commitRef.current.highlights = commit;

	return (
		<Accordion.Item title={t('Highlights')} {...props}>
			<FieldGroup>
				<Field>
					<Field.Label>{t('Highlights_List')}</Field.Label>
					<Field.Row>
						<TextAreaInput rows={4} value={highlights} onChange={handleHighlights} />
					</Field.Row>
					<Field.Hint>{t('Highlights_How_To')}</Field.Hint>
				</Field>
			</FieldGroup>
		</Accordion.Item>
	);
};

export default PreferencesHighlightsSection;
