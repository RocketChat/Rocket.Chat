import type { SelectOption } from '@rocket.chat/fuselage';
import { InputBox, Field, MultiSelect, FieldGroup, Box, Select, FieldLabel, FieldRow, FieldError, Callout } from '@rocket.chat/fuselage';
import type { TranslationKey } from '@rocket.chat/ui-contexts';
import { useId, useMemo } from 'react';
import { useFormContext, Controller, useFieldArray } from 'react-hook-form';
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

// TODO: replace `Select` in favor `SelectFiltered`
const BusinessHoursForm = ({ type }: { type?: 'default' | 'custom' }) => {
	const { t } = useTranslation();
	const timeZones = useTimezoneNameList();
	const timeZonesOptions: SelectOption[] = useMemo(() => timeZones.map((name) => [name, t(name as TranslationKey)]), [t, timeZones]);
	const daysOptions: SelectOption[] = useMemo(() => DAYS_OF_WEEK.map((day) => [day, t(day as TranslationKey)]), [t]);

	const {
		watch,
		control,
		formState: { errors },
	} = useFormContext<BusinessHoursFormData>();
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
			{daysTimeFields.map((dayTime, index) => {
				const startTimeError = errors.daysTime?.[index]?.start?.time;
				const finishTimeError = errors.daysTime?.[index]?.finish?.time;

				return (
					<Field key={dayTime.id}>
						<FieldLabel>{t(dayTime.day as TranslationKey)}</FieldLabel>
						<FieldRow>
							<Box display='flex' flexDirection='column' flexGrow={1} mie={2}>
								<FieldLabel htmlFor={`${daysTimeField + index}-start`}>{t('Open')}</FieldLabel>
								<Controller
									name={`daysTime.${index}.start.time`}
									rules={{
										validate: (value, formValues) => {
											const finishTime = formValues.daysTime?.[index]?.finish?.time;
											if (!finishTime) return true;
											if (value === finishTime) {
												return t('Start_and_finish_time_cannot_be_the_same');
											}
											if (value > finishTime) {
												return t('Start_time_must_be_before_finish_time');
											}
											return true;
										},
									}}
									render={({ field }) => (
										<InputBox
											id={`${daysTimeField + index}-start`}
											type='time'
											{...field}
											error={startTimeError?.message}
											aria-invalid={!!startTimeError}
											aria-describedby={startTimeError ? `${daysTimeField + index}-start-error` : undefined}
										/>
									)}
								/>
								{startTimeError && (
									<FieldError aria-live='assertive' id={`${daysTimeField + index}-start-error`}>
										{startTimeError.message}
									</FieldError>
								)}
							</Box>
							<Box display='flex' flexDirection='column' flexGrow={1} mis={2}>
								<FieldLabel htmlFor={`${daysTimeField + index}-finish`}>{t('Close')}</FieldLabel>
								<Controller
									name={`daysTime.${index}.finish.time`}
									rules={{
										validate: (value, formValues) => {
											const startTime = formValues.daysTime?.[index]?.start?.time;
											if (!startTime) return true;
											if (value === startTime) {
												return t('Start_and_finish_time_cannot_be_the_same');
											}
											if (value < startTime) {
												return t('Finish_time_must_be_after_start_time');
											}
											return true;
										},
									}}
									render={({ field }) => (
										<InputBox
											id={`${daysTimeField + index}-finish`}
											type='time'
											{...field}
											error={finishTimeError?.message}
											aria-invalid={!!finishTimeError}
											aria-describedby={finishTimeError ? `${daysTimeField + index}-finish-error` : undefined}
										/>
									)}
								/>
								{finishTimeError && (
									<FieldError aria-live='assertive' id={`${daysTimeField + index}-finish-error`}>
										{finishTimeError.message}
									</FieldError>
								)}
							</Box>
						</FieldRow>
					</Field>
				);
			})}
		</FieldGroup>
	);
};

export default BusinessHoursForm;
