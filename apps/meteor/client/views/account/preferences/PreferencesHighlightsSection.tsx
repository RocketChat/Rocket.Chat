import { AccordionItem } from '@rocket.chat/fuselage';
import { Field, FieldGroup, FieldLabel, FieldRow, FieldHint, TextAreaInput } from '@rocket.chat/fuselage-forms';
import { Controller, useFormContext } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

const PreferencesHighlightsSection = () => {
	const { t } = useTranslation();
	const { control } = useFormContext();

	return (
		<AccordionItem title={t('Highlights')}>
			<FieldGroup>
				<Field>
					<FieldLabel>{t('Highlights_List')}</FieldLabel>
					<FieldRow>
						<Controller control={control} name='highlights' render={({ field }) => <TextAreaInput {...field} rows={4} />} />
					</FieldRow>
					<FieldHint>{t('Highlights_How_To')}</FieldHint>
				</Field>
			</FieldGroup>
		</AccordionItem>
	);
};

export default PreferencesHighlightsSection;
