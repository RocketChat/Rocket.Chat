import { Field, FieldLabel, FieldRow, ToggleSwitch } from '@rocket.chat/fuselage-forms';
import { AccordionItem, NumberInput } from '@rocket.chat/fuselage';
import { useId } from 'react';
import { Controller, useFormContext } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

const PreferencesUserPresenceSection = () => {
	const { t } = useTranslation();
	const { register, control } = useFormContext();

	const idleTimeLimit = useId();

	return (
		<AccordionItem title={t('User_Presence')}>
			<Field>
				<FieldRow>
					<FieldLabel required>{t('Enable_Auto_Away')}</FieldLabel>
					<Controller
						name='enableAutoAway'
						control={control}
						render={({ field: { ref, value, onChange } }) => <ToggleSwitch ref={ref} checked={value} onChange={onChange} />}
					/>
				</FieldRow>
			</Field>
			<Field>
				<FieldLabel required>{t('Idle_Time_Limit')}</FieldLabel>
				<FieldRow>
					<NumberInput id={idleTimeLimit} {...register('idleTimeLimit')} />
				</FieldRow>
			</Field>
		</AccordionItem>
	);
};

export default PreferencesUserPresenceSection;
