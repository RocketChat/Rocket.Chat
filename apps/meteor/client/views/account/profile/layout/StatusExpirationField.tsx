import type { SelectOption } from '@rocket.chat/fuselage';
import { InputBox, Stack } from '@rocket.chat/fuselage';
import { Field, FieldError, FieldHint, FieldLabel, FieldRow, Select } from '@rocket.chat/fuselage-forms';
import type { ChangeEvent } from 'react';
import { Controller, useFormContext } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

import { validateStatusExpiration } from '../../../../lib/statusDurations';
import type { AccountProfileFormValues } from '../getProfileInitialValues';

type StatusExpirationFieldProps = {
	statusDurationOptions: SelectOption[];
	durationDisabled: boolean;
	customDateTimeDisabled: boolean;
};

/**
 * Chooses when the status clears, with a date and time picker for a custom expiration.
 */
const StatusExpirationField = ({ statusDurationOptions, durationDisabled, customDateTimeDisabled }: StatusExpirationFieldProps) => {
	const { t } = useTranslation();
	const {
		control,
		watch,
		formState: { errors },
	} = useFormContext<AccountProfileFormValues>();
	const statusDuration = watch('statusDuration');

	return (
		<Field>
			<FieldLabel>{t('Status_clear_after')}</FieldLabel>
			<Stack gap='x8'>
				<FieldRow>
					<Controller
						control={control}
						name='statusDuration'
						rules={{
							deps: ['statusCustomDate', 'statusCustomTime'],
							validate: (value, { statusCustomDate, statusCustomTime }) =>
								validateStatusExpiration(value, { statusCustomDate, statusCustomTime }, t),
						}}
						render={({ field: { value, onChange } }) => (
							<Select
								value={value}
								options={statusDurationOptions}
								disabled={durationDisabled}
								onChange={(next) => onChange(String(next))}
							/>
						)}
					/>
				</FieldRow>
				{statusDuration === 'custom' && (
					<Stack direction='row' gap='x8'>
						<Controller
							control={control}
							name='statusCustomDate'
							render={({ field: { value, onChange } }) => (
								<InputBox
									aria-label={t('Status_expiration_date')}
									type='date'
									disabled={customDateTimeDisabled}
									value={value}
									onChange={(e: ChangeEvent<HTMLInputElement>) => onChange(e.currentTarget.value)}
									min={new Date().toLocaleDateString('en-CA')}
								/>
							)}
						/>
						<Controller
							control={control}
							name='statusCustomTime'
							render={({ field: { value, onChange } }) => (
								<InputBox
									aria-label={t('Status_expiration_time')}
									type='time'
									disabled={customDateTimeDisabled}
									value={value}
									onChange={(e: ChangeEvent<HTMLInputElement>) => onChange(e.currentTarget.value)}
								/>
							)}
						/>
					</Stack>
				)}
			</Stack>
			{errors.statusDuration && <FieldError>{errors.statusDuration.message}</FieldError>}
			<FieldHint>{t('Status_new_status_warning')}</FieldHint>
		</Field>
	);
};

export default StatusExpirationField;
