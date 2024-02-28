import { Accordion, Field, FieldGroup, FieldLabel, FieldRow, FieldHint, TextAreaInput } from '@rocket.chat/fuselage';
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
					<FieldLabel htmlFor={highlightsId}>{t('Highlights_List')}</FieldLabel>
					<FieldRow>
						<TextAreaInput id={highlightsId} {...register('highlights')} rows={4} />
					</FieldRow>
					<FieldHint>{t('Highlights_How_To')}</FieldHint>
				</Field>
			</FieldGroup>
		</Accordion.Item>
	);
};

export default PreferencesHighlightsSection;
