import type { SelectOption } from '@rocket.chat/fuselage';
import { InputBox, Field, MultiSelect, FieldGroup, Box, Select, FieldLabel, FieldRow, Callout } from '@rocket.chat/fuselage';
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
// TODO: add time validation for start and finish not be equal on UI
// TODO: add time validation for start not be higher than finish on UI
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
				<Field key={dayTime.id}>
					<FieldLabel>{t(dayTime.day as TranslationKey)}</FieldLabel>
					<FieldRow>
						<Box display='flex' flexDirection='column' flexGrow={1} mie={2}>
							<FieldLabel htmlFor={`${daysTimeField + index}-start`}>{t('Open')}</FieldLabel>
							<Controller
								name={`daysTime.${index}.start.time`}
								render={({ field }) => <InputBox id={`${daysTimeField + index}-start`} type='time' {...field} />}
							/>
						</Box>
						<Box display='flex' flexDirection='column' flexGrow={1} mis={2}>
							<FieldLabel htmlFor={`${daysTimeField + index}-finish`}>{t('Close')}</FieldLabel>
							<Controller
								name={`daysTime.${index}.finish.time`}
								render={({ field }) => <InputBox id={`${daysTimeField + index}-finish`} type='time' {...field} />}
							/>
						</Box>
					</FieldRow>
				</Field>
			))}
		</FieldGroup>
	);
};

export default BusinessHoursForm;
