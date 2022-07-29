import { Accordion, Field, NumberInput, FieldGroup, ToggleSwitch } from '@rocket.chat/fuselage';
import { useUserPreference, useTranslation } from '@rocket.chat/ui-contexts';
import React, { useCallback } from 'react';

import { useForm } from '../../../hooks/useForm';

const PreferencesUserPresenceSection = ({ onChange, commitRef, ...props }) => {
	const t = useTranslation();
	const userEnableAutoAway = useUserPreference('enableAutoAway');
	const userIdleTimeLimit = useUserPreference('idleTimeLimit');

	const { values, handlers, commit } = useForm(
		{
			enableAutoAway: userEnableAutoAway,
			idleTimeLimit: userIdleTimeLimit,
		},
		onChange,
	);

	const { enableAutoAway, idleTimeLimit } = values;

	const { handleEnableAutoAway, handleIdleTimeLimit } = handlers;

	commitRef.current.userPreference = commit;

	const onChangeIdleTimeLimit = useCallback((e) => handleIdleTimeLimit(Number(e.currentTarget.value)), [handleIdleTimeLimit]);

	return (
		<Accordion.Item title={t('User_Presence')} {...props}>
			<FieldGroup>
				<Field display='flex' flexDirection='row' justifyContent='spaceBetween' flexGrow={1}>
					<Field.Label>{t('Enable_Auto_Away')}</Field.Label>
					<Field.Row>
						<ToggleSwitch checked={enableAutoAway} onChange={handleEnableAutoAway} />
					</Field.Row>
				</Field>
				<Field>
					<Field.Label>{t('Idle_Time_Limit')}</Field.Label>
					<Field.Row>
						<NumberInput value={idleTimeLimit} onChange={onChangeIdleTimeLimit} />
					</Field.Row>
				</Field>
			</FieldGroup>
		</Accordion.Item>
	);
};

export default PreferencesUserPresenceSection;
