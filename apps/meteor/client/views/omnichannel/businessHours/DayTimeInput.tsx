import { InputBox, Field, Box, FieldLabel, FieldRow, FieldError } from '@rocket.chat/fuselage';
import type { TranslationKey } from '@rocket.chat/ui-contexts';
import { useEffect } from 'react';
import { useFormContext, Controller, useWatch } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

import type { BusinessHoursFormData } from './BusinessHoursForm';

type DayTimeInputProps = {
	index: number;
	day: string;
	daysTimeFieldId: string;
};

const DayTimeInput = ({ index, day, daysTimeFieldId }: DayTimeInputProps) => {
	const { t } = useTranslation();
	const {
		control,
		trigger,
		formState: { errors },
	} = useFormContext<BusinessHoursFormData>();

	const startTimeFieldName = `daysTime.${index}.start.time` as const;
	const finishTimeFieldName = `daysTime.${index}.finish.time` as const;

	const startTime = useWatch({ control, name: startTimeFieldName });
	const finishTime = useWatch({ control, name: finishTimeFieldName });

	// Revalidate finish time when start time changes
	useEffect(() => {
		if (startTime !== undefined) {
			trigger(finishTimeFieldName);
		}
	}, [startTime, trigger, finishTimeFieldName]);

	// Revalidate start time when finish time changes
	useEffect(() => {
		if (finishTime !== undefined) {
			trigger(startTimeFieldName);
		}
	}, [finishTime, trigger, startTimeFieldName]);

	const startTimeError = errors.daysTime?.[index]?.start?.time;
	const finishTimeError = errors.daysTime?.[index]?.finish?.time;

	return (
		<Field>
			<FieldLabel>{t(day as TranslationKey)}</FieldLabel>
			<FieldRow>
				<Box display='flex' flexDirection='column' flexGrow={1} mie={2}>
					<FieldLabel htmlFor={`${daysTimeFieldId + index}-start`}>{t('Open')}</FieldLabel>
					<Controller
						name={startTimeFieldName}
						control={control}
						rules={{
							validate: (value, formValues) => {
								const finishTimeValue = formValues.daysTime?.[index]?.finish?.time;
								if (!finishTimeValue) return true;
								if (value === finishTimeValue) {
									return t('error-business-hour-finish-time-equals-start-time');
								}
								if (value > finishTimeValue) {
									return t('error-business-hour-finish-time-before-start-time');
								}
								return true;
							},
						}}
						render={({ field }) => (
							<InputBox
								id={`${daysTimeFieldId + index}-start`}
								type='time'
								{...field}
								error={startTimeError?.message}
								aria-invalid={!!startTimeError}
								aria-describedby={startTimeError ? `${daysTimeFieldId + index}-start-error` : undefined}
							/>
						)}
					/>
					{startTimeError && (
						<FieldError aria-live='assertive' id={`${daysTimeFieldId + index}-start-error`}>
							{startTimeError.message}
						</FieldError>
					)}
				</Box>
				<Box display='flex' flexDirection='column' flexGrow={1} mis={2}>
					<FieldLabel htmlFor={`${daysTimeFieldId + index}-finish`}>{t('Close')}</FieldLabel>
					<Controller
						name={finishTimeFieldName}
						control={control}
						rules={{
							validate: (value, formValues) => {
								const startTimeValue = formValues.daysTime?.[index]?.start?.time;
								if (!startTimeValue) return true;
								if (value === startTimeValue) {
									return t('error-business-hour-finish-time-equals-start-time');
								}
								if (value < startTimeValue) {
									return t('error-business-hour-finish-time-before-start-time');
								}
								return true;
							},
						}}
						render={({ field }) => (
							<InputBox
								id={`${daysTimeFieldId + index}-finish`}
								type='time'
								{...field}
								error={finishTimeError?.message}
								aria-invalid={!!finishTimeError}
								aria-describedby={finishTimeError ? `${daysTimeFieldId + index}-finish-error` : undefined}
							/>
						)}
					/>
					{finishTimeError && (
						<FieldError aria-live='assertive' id={`${daysTimeFieldId + index}-finish-error`}>
							{finishTimeError.message}
						</FieldError>
					)}
				</Box>
			</FieldRow>
		</Field>
	);
};

export default DayTimeInput;
