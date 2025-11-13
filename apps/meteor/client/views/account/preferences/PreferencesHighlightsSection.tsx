import { AccordionItem } from '@rocket.chat/fuselage';
import { Field, FieldGroup, FieldLabel, FieldRow, FieldHint, TextAreaInput } from '@rocket.chat/fuselage-forms';
import { useFormContext } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

const PreferencesHighlightsSection = () => {
	const { t } = useTranslation();
	const { register } = useFormContext();

	return (
		<AccordionItem title={t('Highlights')}>
			<FieldGroup>
				<Field>
					<FieldLabel>{t('Highlights_List')}</FieldLabel>
					<FieldRow>
						<TextAreaInput {...register('highlights')} rows={4} />
					</FieldRow>
					<FieldHint>{t('Highlights_How_To')}</FieldHint>
				</Field>
			</FieldGroup>
		</AccordionItem>
	);
};

export default PreferencesHighlightsSection;
