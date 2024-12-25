import { AccordionItem, Field, FieldLabel, FieldRow, NumberInput, FieldGroup, ToggleSwitch } from '@rocket.chat/fuselage';
import { useUniqueId } from '@rocket.chat/fuselage-hooks';
import React from 'react';
import { Controller, useFormContext } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

import IdleTimeEditor from './IdleTimeEditor';

const PreferencesUserPresenceSection = () => {
	const { t } = useTranslation();
	const { control } = useFormContext();

	const enableAutoAwayId = useUniqueId();

	return (
		<AccordionItem title={t('User_Presence')}>
			<FieldGroup>
				<Field>
					<FieldRow>
						<FieldLabel htmlFor={enableAutoAwayId}>{t('Enable_Auto_Away')}</FieldLabel>
						<Controller
							name='enableAutoAway'
							control={control}
							render={({ field: { ref, value, onChange } }) => (
								<ToggleSwitch ref={ref} id={enableAutoAwayId} checked={value} onChange={onChange} />
							)}
						/>
					</FieldRow>
				</Field>
				<Field>
					<FieldLabel>{t('Idle_Time_Limit')}</FieldLabel>
					<Controller
						name='idleTimeLimit'
						control={control}
						render={({ field: { onChange } }) => <IdleTimeEditor onChangeTime={onChange} />}
					/>
				</Field>
			</FieldGroup>
		</AccordionItem>
	);
};

export default PreferencesUserPresenceSection;
