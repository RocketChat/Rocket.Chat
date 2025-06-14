import type { SelectOption } from '@rocket.chat/fuselage';
import { AccordionItem, Field, FieldGroup, FieldLabel, FieldRow, Select } from '@rocket.chat/fuselage';
import { useLanguages } from '@rocket.chat/ui-contexts';
import { useId, useMemo } from 'react';
import { Controller, useFormContext } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

const PreferencesLocalizationSection = () => {
	const { t } = useTranslation();
	const languages = useLanguages();

	const { control } = useFormContext();

	const languageOptions = useMemo(() => languages.map(({ key, name }): SelectOption => [key, name]), [languages]);

	const languageId = useId();

	return (
		<AccordionItem title={t('Localization')} defaultExpanded>
			<FieldGroup>
				<Field>
					<FieldLabel is='span' id={languageId}>
						{t('Language')}
					</FieldLabel>
					<FieldRow>
						<Controller
							control={control}
							name='language'
							render={({ field: { value, onChange } }) => (
								<Select aria-labelledby={languageId} value={value} onChange={onChange} options={languageOptions} />
							)}
						/>
					</FieldRow>
				</Field>
			</FieldGroup>
		</AccordionItem>
	);
};

export default PreferencesLocalizationSection;
