import type { SelectOption } from '@rocket.chat/fuselage';
import { Accordion, Field, FieldGroup, FieldLabel, FieldRow, Select } from '@rocket.chat/fuselage';
import { useUniqueId } from '@rocket.chat/fuselage-hooks';
import { useLanguages } from '@rocket.chat/ui-contexts';
import React, { useMemo } from 'react';
import { useFormContext, Controller } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

const PreferencesLocalizationSection = () => {
	const { t } = useTranslation();
	const languages = useLanguages();

	const { control } = useFormContext();

	const languageOptions = useMemo(() => languages.map(({ key, name }): SelectOption => [key, name]), [languages]);

	const languageId = useUniqueId();

	return (
		<Accordion.Item title={t('Localization')} defaultExpanded>
			<FieldGroup>
				<Field>
					<FieldLabel htmlFor={languageId}>{t('Language')}</FieldLabel>
					<FieldRow>
						<Controller
							control={control}
							name='language'
							render={({ field: { value, onChange } }) => (
								<Select id={languageId} value={value} onChange={onChange} options={languageOptions} />
							)}
						/>
					</FieldRow>
				</Field>
			</FieldGroup>
		</Accordion.Item>
	);
};

export default PreferencesLocalizationSection;
