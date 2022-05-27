import { Accordion, Field, Select, FieldGroup } from '@rocket.chat/fuselage';
import { useUserPreference, useLanguages, useTranslation } from '@rocket.chat/ui-contexts';
import React, { ComponentProps, FC, useMemo } from 'react';

import { useForm } from '../../../hooks/useForm';
import { useAccountPreferencesForm } from '../contexts/AccountPreferencesFormContext';

type PreferencesLocalizationFormValues = {
	language: string;
};

type PreferencesLocalizationSectionProps = Partial<ComponentProps<typeof Accordion.Item>>;

const PreferencesLocalizationSection: FC<PreferencesLocalizationSectionProps> = ({ ...props }) => {
	const t = useTranslation();
	const userLanguage = useUserPreference('language') || '';
	const languages = useLanguages();
	const { commitRef, onChange } = useAccountPreferencesForm();

	const languageOptions = useMemo<[string, string][]>(() => languages.map(({ key, name }) => [key, name]), [languages]);

	const { values, handlers, commit } = useForm({ language: userLanguage }, onChange);

	const { language } = values as PreferencesLocalizationFormValues;
	const { handleLanguage } = handlers;

	commitRef.current.localization = commit;

	return (
		<Accordion.Item title={t('Localization')} {...props}>
			<FieldGroup>
				<Field>
					<Field.Label>{t('Language')}</Field.Label>
					<Field.Row>
						<Select value={language} onChange={handleLanguage} options={languageOptions} />
					</Field.Row>
				</Field>
			</FieldGroup>
		</Accordion.Item>
	);
};

export default PreferencesLocalizationSection;
