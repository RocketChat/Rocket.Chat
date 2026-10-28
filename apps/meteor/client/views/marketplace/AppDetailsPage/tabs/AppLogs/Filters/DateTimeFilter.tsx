import { InputBox, Stack } from '@rocket.chat/fuselage';
import type { Control } from 'react-hook-form';
import { Controller } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

export type DateTimeFilterProps = {
	type: 'start' | 'end';
	id?: string;
	control: Control<{ startDate?: string; startTime?: string; endDate?: string; endTime?: string }>;
	error?: boolean;
};

const DateTimeFilter = ({ type, control, id, error }: DateTimeFilterProps) => {
	const { t } = useTranslation();

	return (
		<Stack direction='row' gap='x8' id={id}>
			<Controller
				control={control}
				name={type === 'start' ? 'startDate' : 'endDate'}
				render={({ field }) => (
					<InputBox
						aria-label={type === 'start' ? t('Start_Date') : t('End_Date')}
						type='date'
						{...field}
						error={error ? t('Required_field') : undefined}
					/>
				)}
			/>

			<Controller
				control={control}
				name={type === 'start' ? 'startTime' : 'endTime'}
				render={({ field }) => <InputBox aria-label={type === 'start' ? t('Start_Time') : t('End_Time')} type='time' {...field} />}
			/>
		</Stack>
	);
};

export default DateTimeFilter;
