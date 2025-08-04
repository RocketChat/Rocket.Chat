import type { SelectOption } from '@rocket.chat/fuselage';
import { AccordionItem } from '@rocket.chat/fuselage';
import { Field, FieldGroup, FieldLabel, FieldRow, Select } from '@rocket.chat/fuselage-forms';
import { useLanguages } from '@rocket.chat/ui-contexts';
import { useMemo } from 'react';
import { Controller, useFormContext } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

const PreferencesLocalizationSection = () => {
	const { t } = useTranslation();
	const languages = useLanguages();

	const { control } = useFormContext();

	const languageOptions = useMemo(() => languages.map(({ key, name }): SelectOption => [key, name]), [languages]);

	return (
		<AccordionItem title={t('Localization')} defaultExpanded>
			<FieldGroup>
				<Field>
					<FieldLabel>{t('Language')}</FieldLabel>
					<FieldRow>
						<Controller
							control={control}
							name='language'
							render={({ field: { value, onChange } }) => <Select value={value} onChange={onChange} options={languageOptions} />}
						/>
					</FieldRow>
				</Field>
			</FieldGroup>
		</AccordionItem>
	);
};

export default PreferencesLocalizationSection;
