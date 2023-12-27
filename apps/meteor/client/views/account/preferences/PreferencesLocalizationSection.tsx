import type { SelectOption } from '@rocket.chat/fuselage';
import { Accordion, Field, FieldGroup, FieldLabel, FieldRow, Select } from '@rocket.chat/fuselage';
import { useUniqueId } from '@rocket.chat/fuselage-hooks';
import { useLanguages, useTranslation } from '@rocket.chat/ui-contexts';
import React, { useMemo } from 'react';
import { useFormContext, Controller } from 'react-hook-form';

const PreferencesLocalizationSection = () => {
	const t = useTranslation();
	const languages = useLanguages();

	const { control } = useFormContext();

	const languageOptions = useMemo(() => {
		const mapOptions: SelectOption[] = languages.map(({ key, name }) => [key, name]);
		mapOptions.sort(([a], [b]) => a.localeCompare(b));
		return mapOptions;
	}, [languages]);


	const languageId = useUniqueId();

	return (
		<Accordion.Item title={t('Localization')} defaultExpanded>
			<FieldGroup>
				<Field>
					<FieldLabel htmlFor={languageId}>{t('Language')}</FieldLabel>
					<FieldRow>
						<Controller
							name='language'
							control={control}
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
