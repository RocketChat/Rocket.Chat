import { Accordion, Field, FieldGroup, MultiSelect, ToggleSwitch, Callout } from '@rocket.chat/fuselage';
import React, { useMemo } from 'react';

import { useTranslation } from '../../../contexts/TranslationContext';
import { useUserPreference } from '../../../contexts/UserContext';
import { useForm } from '../../../hooks/useForm';

const PreferencesGlobalSection = ({ onChange, commitRef, ...props }) => {
	const t = useTranslation();

	const userDontAskAgainList = useUserPreference('dontAskAgainList');
	const userEnableLegacyMessages = useUserPreference('enableLegacyMessages');

	const options = useMemo(() => (userDontAskAgainList || []).map(({ action, label }) => [action, label]), [userDontAskAgainList]);

	const selectedOptions = options.map(([action]) => action);

	const { values, handlers, commit } = useForm(
		{
			dontAskAgainList: selectedOptions,
			enableLegacyMessages: userEnableLegacyMessages,
		},
		onChange,
	);

	const { dontAskAgainList, enableLegacyMessages } = values;

	const { handleDontAskAgainList, handleEnableLegacyMessages } = handlers;

	commitRef.current.global = commit;

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
				<Field display='flex' alignItems='center' flexDirection='row' justifyContent='spaceBetween' flexGrow={1}>
					<Field.Label>{t('Enable_legacy_messages')}</Field.Label>
					<Field.Row>
						<ToggleSwitch checked={enableLegacyMessages} onChange={handleEnableLegacyMessages} />
					</Field.Row>
				</Field>
				<Callout type='warning'>{t('Enable_legacy_messages_alert')}</Callout>
			</FieldGroup>
		</Accordion.Item>
	);
};

export default PreferencesGlobalSection;
