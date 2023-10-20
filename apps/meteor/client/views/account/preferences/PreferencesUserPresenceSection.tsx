import { Accordion, Field, FieldLabel, FieldRow, NumberInput, FieldGroup, ToggleSwitch, Box } from '@rocket.chat/fuselage';
import { useUniqueId } from '@rocket.chat/fuselage-hooks';
import { useTranslation } from '@rocket.chat/ui-contexts';
import React from 'react';
import { Controller, useFormContext } from 'react-hook-form';

const PreferencesUserPresenceSection = () => {
	const t = useTranslation();
	const { register, control } = useFormContext();

	const enableAutoAwayId = useUniqueId();
	const idleTimeLimit = useUniqueId();

	return (
		<Accordion.Item title={t('User_Presence')}>
			<FieldGroup>
				<Field>
					<Box display='flex' flexDirection='row' justifyContent='spaceBetween' flexGrow={1}>
						<FieldLabel htmlFor={enableAutoAwayId}>{t('Enable_Auto_Away')}</FieldLabel>
						<FieldRow>
							<Controller
								name='enableAutoAway'
								control={control}
								render={({ field: { ref, value, onChange } }) => (
									<ToggleSwitch ref={ref} id={enableAutoAwayId} checked={value} onChange={onChange} />
								)}
							/>
						</FieldRow>
					</Box>
				</Field>
				<Field>
					<FieldLabel htmlFor={idleTimeLimit}>{t('Idle_Time_Limit')}</FieldLabel>
					<FieldRow>
						<NumberInput id={idleTimeLimit} {...register('idleTimeLimit')} />
					</FieldRow>
				</Field>
			</FieldGroup>
		</Accordion.Item>
	);
};

export default PreferencesUserPresenceSection;
