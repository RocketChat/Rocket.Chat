import { Accordion, Field, Select, FieldGroup } from '@rocket.chat/fuselage';
import { useUserPreference, useLanguages, useTranslation } from '@rocket.chat/ui-contexts';
import React, { useMemo } from 'react';

import { useForm } from '../../../hooks/useForm';

const PreferencesLocalizationSection = ({ onChange, commitRef, ...props }) => {
	const t = useTranslation();
	const userLanguage = useUserPreference('language') || '';
	const languages = useLanguages();

	const languageOptions = useMemo(() => languages.map(({ key, name }) => [key, name]).sort(([a], [b]) => a - b), [languages]);

	const { values, handlers, commit } = useForm({ language: userLanguage }, onChange);

	const { language } = values;
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
