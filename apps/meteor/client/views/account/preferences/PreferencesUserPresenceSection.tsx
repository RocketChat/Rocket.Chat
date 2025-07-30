import { AccordionItem } from '@rocket.chat/fuselage';
import { Field, FieldGroup, FieldLabel, FieldRow, ToggleSwitch, NumberInput } from '@rocket.chat/fuselage-forms';
import { Controller, useFormContext } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

const PreferencesUserPresenceSection = () => {
	const { t } = useTranslation();
	const { register, control } = useFormContext();

	return (
		<AccordionItem title={t('User_Presence')}>
			<FieldGroup>
				<Field>
					<FieldRow>
						<FieldLabel>{t('Enable_Auto_Away')}</FieldLabel>
						<Controller
							name='enableAutoAway'
							control={control}
							render={({ field: { ref, value, onChange } }) => <ToggleSwitch ref={ref} checked={value} onChange={onChange} />}
						/>
					</FieldRow>
				</Field>
				<Field>
					<FieldLabel>{t('Idle_Time_Limit')}</FieldLabel>
					<FieldRow>
						<NumberInput {...register('idleTimeLimit')} />
					</FieldRow>
				</Field>
			</FieldGroup>
		</AccordionItem>
	);
};

export default PreferencesUserPresenceSection;
