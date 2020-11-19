import React, { useMemo } from 'react';
import { Accordion, Field, Select, FieldGroup } from '@rocket.chat/fuselage';

import { useLanguages, useTranslation } from '../../../contexts/TranslationContext';
import { useUserPreference } from '../../../contexts/UserContext';
import { useForm } from '../../../hooks/useForm';

const PreferencesLocalizationSection = ({ onChange, ...props }) => {
	const t = useTranslation();
	const userLanguage = useUserPreference('language') || '';
	const languages = useLanguages();

	const languageOptions = useMemo(() => languages.map(({ key, name }) => [key, name]).sort(([a], [b]) => a - b), [languages]);

	const { values, handlers } = useForm({ language: userLanguage }, onChange);

	const { language } = values;
	const { handleLanguage } = handlers;

	return <Accordion.Item title={t('Localization')} {...props}>
		<FieldGroup>
			<Field>
				<Field.Label>{t('Language')}</Field.Label>
				<Field.Row>
					<Select value={language} onChange={handleLanguage} options={languageOptions} />
				</Field.Row>
			</Field>
		</FieldGroup>
	</Accordion.Item>;
};

export default PreferencesLocalizationSection;
