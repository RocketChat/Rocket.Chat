import { AccordionItem, Field, FieldLabel, FieldRow, NumberInput, FieldGroup, ToggleSwitch } from '@rocket.chat/fuselage';
import { useId } from 'react';
import { Controller, useFormContext } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

const PreferencesUserPresenceSection = () => {
	const { t } = useTranslation();
	const { register, control } = useFormContext();

	const enableAutoAwayId = useId();
	const idleTimeLimit = useId();

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
					<FieldLabel htmlFor={idleTimeLimit}>{t('Idle_Time_Limit')}</FieldLabel>
					<FieldRow>
						<NumberInput id={idleTimeLimit} {...register('idleTimeLimit')} />
					</FieldRow>
				</Field>
			</FieldGroup>
		</AccordionItem>
	);
};

export default PreferencesUserPresenceSection;
