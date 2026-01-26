import type { SelectOption } from '@rocket.chat/fuselage';
import { InputBox, Field, MultiSelect, FieldGroup, Box, Select, FieldLabel, FieldRow, FieldError, Callout } from '@rocket.chat/fuselage';
import type { TranslationKey } from '@rocket.chat/ui-contexts';
import { useEffect, useId, useMemo } from 'react';
import { useFormContext, Controller, useFieldArray, useWatch } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

import { useTimezoneNameList } from '../../../hooks/useTimezoneNameList';
import { BusinessHoursMultiple } from '../additionalForms';
import { defaultWorkHours, DAYS_OF_WEEK } from './mapBusinessHoursForm';

type mappedDayTime = {
	day: string;
	start: {
		time: string;
	};
	finish: {
		time: string;
	};
	open: boolean;
};

export type BusinessHoursFormData = {
	name: string;
	timezoneName: string;
	daysOpen: string[];
	daysTime: mappedDayTime[];
	departmentsToApplyBusinessHour: string;
	active: boolean;
	departments: {
		value: string;
		label: string;
	}[];
};

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

// TODO: replace `Select` in favor `SelectFiltered`
const BusinessHoursForm = ({ type }: { type?: 'default' | 'custom' }) => {
	const { t } = useTranslation();
	const timeZones = useTimezoneNameList();
	const timeZonesOptions: SelectOption[] = useMemo(() => timeZones.map((name) => [name, t(name as TranslationKey)]), [t, timeZones]);
	const daysOptions: SelectOption[] = useMemo(() => DAYS_OF_WEEK.map((day) => [day, t(day as TranslationKey)]), [t]);

	const { watch, control } = useFormContext<BusinessHoursFormData>();
	const { daysTime } = watch();
	const { fields: daysTimeFields, replace } = useFieldArray({ control, name: 'daysTime' });

	const timezoneField = useId();
	const daysOpenField = useId();
	const daysTimeField = useId();

	const handleChangeDaysTime = (values: string[]) => {
		const newValues = values
			.map((item) => daysTime.find(({ day }) => day === item) || defaultWorkHours(true).find(({ day }) => day === item))
			.filter((item): item is mappedDayTime => Boolean(item));
		replace(newValues);
	};

	return (
		<FieldGroup>
			{type === 'custom' && <BusinessHoursMultiple />}
			<Field>
				<FieldLabel htmlFor={timezoneField}>{t('Timezone')}</FieldLabel>
				<FieldRow>
					<Controller
						name='timezoneName'
						control={control}
						render={({ field }) => <Select id={timezoneField} {...field} options={timeZonesOptions} />}
					/>
				</FieldRow>
				<Callout title={t('Daylight_savings_time')} type='info' mbs='x8'>
					{t('Business_hours_will_update_automatically')}
				</Callout>
			</Field>
			<Field>
				<FieldLabel htmlFor={daysOpenField}>{t('Open_days_of_the_week')}</FieldLabel>
				<FieldRow>
					<Controller
						name='daysOpen'
						control={control}
						render={({ field: { onChange, value, name, onBlur } }) => (
							<MultiSelect
								id={daysOpenField}
								onBlur={onBlur}
								name={name}
								onChange={(values) => {
									handleChangeDaysTime(values);
									onChange(values);
								}}
								options={daysOptions}
								value={value}
								placeholder={t('Select_an_option')}
								w='full'
							/>
						)}
					/>
				</FieldRow>
			</Field>
			{daysTimeFields.map((dayTime, index) => (
				<DayTimeInput key={dayTime.id} index={index} day={dayTime.day} daysTimeFieldId={daysTimeField} />
			))}
		</FieldGroup>
	);
};

export default BusinessHoursForm;

