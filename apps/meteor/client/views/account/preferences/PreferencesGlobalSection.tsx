import type { SelectOption } from '@rocket.chat/fuselage';
import { Select, Accordion, Field, FieldGroup, MultiSelect } from '@rocket.chat/fuselage';
import { useUserPreference, useTranslation } from '@rocket.chat/ui-contexts';
import type { ReactElement } from 'react';
import React, { useMemo } from 'react';

import { useForm } from '../../../hooks/useForm';
import type { FormSectionProps } from './AccountPreferencesPage';

const PreferencesGlobalSection = ({ onChange, commitRef, ...props }: FormSectionProps): ReactElement => {
	const t = useTranslation();

	const userDontAskAgainList = useUserPreference<{ action: string; label: string }[]>('dontAskAgainList');
	const themePreference = useUserPreference<'light' | 'dark' | 'auto'>('themeAppearence');

	const options = useMemo(
		() => (userDontAskAgainList || []).map(({ action, label }) => [action, label]) as SelectOption[],
		[userDontAskAgainList],
	);

	const selectedOptions = options.map(([action]) => action);

	const { values, handlers, commit } = useForm(
		{
			dontAskAgainList: selectedOptions,
			themeAppearence: themePreference,
		},
		onChange,
	);

	const { dontAskAgainList, themeAppearence } = values as {
		dontAskAgainList: string[];
		themeAppearence: string;
	};

	const { handleDontAskAgainList, handleThemeAppearence } = handlers;

	commitRef.current.global = commit;

	const themeOptions: SelectOption[] = [
		['auto', t('Theme_match_system')],
		['light', t('Theme_light')],
		['dark', t('Theme_dark')],
	];

	return (
		<Accordion.Item title={t('Global')} {...props}>
			<FieldGroup>
				<Field>
					<Field.Label>{t('Dont_ask_me_again_list')}</Field.Label>
					<Field.Row>
						<MultiSelect
							placeholder={t('Nothing_found')}
							value={(dontAskAgainList.length > 0 && dontAskAgainList) || undefined}
							onChange={handleDontAskAgainList}
							options={options}
						/>
					</Field.Row>
				</Field>
				<Field>
					<Field.Label>{t('Theme_Appearence')}</Field.Label>
					<Field.Row>
						<Select value={themeAppearence} onChange={handleThemeAppearence} options={themeOptions} />
					</Field.Row>
				</Field>
			</FieldGroup>
		</Accordion.Item>
	);
};

export default PreferencesGlobalSection;
