import { AccordionItem } from '@rocket.chat/fuselage';
import { Field, FieldGroup, FieldHint, FieldLabel, FieldRow, ToggleSwitch, NumberInput } from '@rocket.chat/fuselage-forms';
import { Controller, useFormContext } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

const PreferencesUserPresenceSection = () => {
	const { t } = useTranslation();
	const { control } = useFormContext();

	return (
		<AccordionItem title={t('User_Presence')}>
			<FieldGroup>
				<Field>
					<FieldRow>
						<FieldLabel>{t('Enable_Auto_Away')}</FieldLabel>
						<Controller
							name='enableAutoAway'
							control={control}
							render={({ field: { value, ...field } }) => <ToggleSwitch {...field} checked={value} />}
						/>
					</FieldRow>
					<FieldHint>{t('Enable_Auto_Away_Description')}</FieldHint>
				</Field>
				<Field>
					<FieldLabel>{t('Idle_Time_Limit')}</FieldLabel>
					<FieldRow>
						<Controller
							name='idleTimeLimit'
							control={control}
							render={({ field: { value, ...field } }) => <NumberInput {...field} value={value} />}
						/>
					</FieldRow>
					<FieldHint>{t('Idle_Time_Limit_Description')}</FieldHint>
				</Field>
			</FieldGroup>
		</AccordionItem>
	);
};

export default PreferencesUserPresenceSection;
