import { Accordion, Field, FieldLabel, FieldRow, NumberInput, FieldGroup, ToggleSwitch } from '@rocket.chat/fuselage';
import { useUniqueId } from '@rocket.chat/fuselage-hooks';
import React from 'react';
import { Controller, useFormContext } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

const PreferencesUserPresenceSection = () => {
	const { t } = useTranslation();
	const { register, control } = useFormContext();

	const enableAutoAwayId = useUniqueId();
	const idleTimeLimitH = useUniqueId();
	const idleTimeLimitM = useUniqueId();
	const idleTimeLimitS = useUniqueId();


	return (
		<Accordion.Item title={t('User_Presence')}>
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
					<FieldLabel htmlFor={idleTimeLimitH}>{t('Idle_Time_Limit')}</FieldLabel>
					<FieldRow>
					<FieldLabel htmlFor="idleTimeLimitH">{t('hours')} </FieldLabel>
						<NumberInput id={idleTimeLimitH} {...register('idleTimeLimitH')} />
						<FieldLabel htmlFor="idleTimeLimitM">{t('minutes')} </FieldLabel>
						<NumberInput id={idleTimeLimitM} {...register('idleTimeLimitM')} max={59} min={0} />
						<FieldLabel htmlFor="idleTimeLimitS">{t('seconds')} </FieldLabel>
						<NumberInput id={idleTimeLimitS} {...register('idleTimeLimitS')} max={59} min={0} />
					</FieldRow>
				</Field>
			</FieldGroup>
		</Accordion.Item>
	);
};

export default PreferencesUserPresenceSection;