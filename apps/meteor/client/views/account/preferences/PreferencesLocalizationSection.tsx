import type { SelectOption } from '@rocket.chat/fuselage';
import { Accordion, Field, Select, FieldGroup } from '@rocket.chat/fuselage';
import { useUserPreference, useLanguages, useTranslation } from '@rocket.chat/ui-contexts';
import type { ReactElement } from 'react';
import React, { useEffect, useMemo } from 'react';

import { useForm } from '../../../hooks/useForm';
import type { FormSectionProps } from './AccountPreferencesPage';

const PreferencesLocalizationSection = ({
	onChange,
	commitRef,
	...props
}: { defaultExpanded?: boolean } & FormSectionProps): ReactElement => {
	const t = useTranslation();
	const userLanguage = useUserPreference('language') || '';
	const languages = useLanguages();

	const languageOptions = useMemo(() => {
		const mapOptions: SelectOption[] = languages.map(({ key, name }) => [key, name]);
		mapOptions.sort(([a], [b]) => a.localeCompare(b));
		return mapOptions;
	}, [languages]);

	const { values, handlers, commit } = useForm({ language: userLanguage }, onChange);

	const { language } = values as { language: string };
	const { handleLanguage } = handlers;

	useEffect(() => {
		if (commitRef) {
			commitRef.current.localization = commit;
		}
	}, [commit, commitRef]);

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
