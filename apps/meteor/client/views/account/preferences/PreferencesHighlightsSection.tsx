import { AccordionItem, Field, FieldGroup, FieldLabel, FieldRow, FieldHint, TextAreaInput } from '@rocket.chat/fuselage';
import { useId } from 'react';
import { useFormContext } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

const PreferencesHighlightsSection = () => {
	const { t } = useTranslation();
	const { register } = useFormContext();

	const highlightsId = useId();

	return (
		<AccordionItem title={t('Highlights')}>
			<FieldGroup>
				<Field>
					<FieldLabel htmlFor={highlightsId}>{t('Highlights_List')}</FieldLabel>
					<FieldRow>
						<TextAreaInput id={highlightsId} {...register('highlights')} rows={4} />
					</FieldRow>
					<FieldHint>{t('Highlights_How_To')}</FieldHint>
				</Field>
			</FieldGroup>
		</AccordionItem>
	);
};

export default PreferencesHighlightsSection;
