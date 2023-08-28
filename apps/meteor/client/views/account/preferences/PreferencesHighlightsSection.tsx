import { Accordion, Field, FieldGroup, TextAreaInput } from '@rocket.chat/fuselage';
import { useUniqueId } from '@rocket.chat/fuselage-hooks';
import { useTranslation } from '@rocket.chat/ui-contexts';
import React from 'react';
import { useFormContext } from 'react-hook-form';

const PreferencesHighlightsSection = () => {
	const t = useTranslation();
	const { register } = useFormContext();

	const highlightsId = useUniqueId();

	return (
		<Accordion.Item title={t('Highlights')}>
			<FieldGroup>
				<Field>
					<Field.Label htmlFor={highlightsId}>{t('Highlights_List')}</Field.Label>
					<Field.Row>
						<TextAreaInput id={highlightsId} {...register('highlights')} rows={4} />
					</Field.Row>
					<Field.Hint>{t('Highlights_How_To')}</Field.Hint>
				</Field>
			</FieldGroup>
		</Accordion.Item>
	);
};

export default PreferencesHighlightsSection;
