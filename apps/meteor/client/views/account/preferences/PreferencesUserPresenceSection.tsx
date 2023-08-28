import { Accordion, Field, NumberInput, FieldGroup, ToggleSwitch, Box } from '@rocket.chat/fuselage';
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
						<Field.Label htmlFor={enableAutoAwayId}>{t('Enable_Auto_Away')}</Field.Label>
						<Field.Row>
							<Controller
								name='enableAutoAway'
								control={control}
								render={({ field: { ref, value, onChange } }) => (
									<ToggleSwitch ref={ref} id={enableAutoAwayId} checked={value} onChange={onChange} />
								)}
							/>
						</Field.Row>
					</Box>
				</Field>
				<Field>
					<Field.Label htmlFor={idleTimeLimit}>{t('Idle_Time_Limit')}</Field.Label>
					<Field.Row>
						<NumberInput id={idleTimeLimit} {...register('idleTimeLimit')} />
					</Field.Row>
				</Field>
			</FieldGroup>
		</Accordion.Item>
	);
};

export default PreferencesUserPresenceSection;
